/**
 * Global Cover Photo Hook - Single Source of Truth
 * Handles upload, positioning, and state management for cover photos
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { uploadToWasabi } from '@/services/media/LegacyUploadService';
import { processWasabiUrl, getWasabiProxyObjectUrl } from '@/services/media/LegacyMediaService';
import { userPhotosService } from '@/services/photos/UserPhotosService';
import { toast } from 'sonner';

// Global state
let globalCoverPhotoUrl: string | null = null;
let globalCoverPosition: string = 'center center';
let globalCoverGradient: string = 'hsl(var(--muted))';
let globalCoverLoading: boolean = false;

// Listeners for real-time updates
const coverPhotoListeners: Set<(data: { url: string | null; position: string }) => void> = new Set();
const coverGradientListeners: Set<(gradient: string) => void> = new Set();
const coverLoadingListeners: Set<(loading: boolean) => void> = new Set();

// No local storage - everything live from database

// Preload helper to avoid flicker: only swap image after it's fully loaded
const preloadImage = (url: string) =>
  new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = url;
  });

const isDefaultPosition = (p?: string | null) => {
  if (!p) return true;
  const norm = p.trim().toLowerCase();
  return norm === 'center' || norm === 'center center' || norm === '50% 50%';
};

// Global notification functions - no caching, live state only
export const notifyGlobalCoverPhotoChange = (url: string | null, position: string = 'center center') => {
  console.log('🖼️ Cover photo changed:', { url: url ? (url.startsWith('http') ? 'HTTP_URL' : url.startsWith('blob:') || url.startsWith('data:') ? 'BLOB/DATA' : 'KEY') : 'NULL', position });
  
  // Update in-memory state
  if (url !== null) globalCoverPhotoUrl = url;
  globalCoverPosition = position;
  
  // No caching - notify listeners immediately
  coverPhotoListeners.forEach(listener => listener({ url: globalCoverPhotoUrl, position }));
};

export const notifyGlobalCoverGradientChange = (gradient: string) => {
  globalCoverGradient = gradient;
  coverGradientListeners.forEach(listener => listener(gradient));
};

export const notifyGlobalCoverLoadingChange = (loading: boolean) => {
  globalCoverLoading = loading;
  coverLoadingListeners.forEach(listener => listener(loading));
};

export const useGlobalCoverPhoto = () => {
  const { user } = useAuth();
  
  // State management - no cache, load fresh from database
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(globalCoverPhotoUrl);
  const [coverPosition, setCoverPosition] = useState<string>(globalCoverPosition);
  const [coverGradient, setCoverGradient] = useState<string>(globalCoverGradient);
  
  const [isLoading, setIsLoading] = useState<boolean>(globalCoverLoading);

  // No caching needed - load fresh from database always

  // Subscribe to global changes
  useEffect(() => {
    const handleCoverPhotoChange = (data: { url: string | null; position: string }) => {
      setCoverPhotoUrl(data.url);
      setCoverPosition(data.position);
    };
    
    const handleGradientChange = (gradient: string) => setCoverGradient(gradient);
    const handleLoadingChange = (loading: boolean) => setIsLoading(loading);

    coverPhotoListeners.add(handleCoverPhotoChange);
    coverGradientListeners.add(handleGradientChange);
    coverLoadingListeners.add(handleLoadingChange);

    return () => {
      coverPhotoListeners.delete(handleCoverPhotoChange);
      coverGradientListeners.delete(handleGradientChange);
      coverLoadingListeners.delete(handleLoadingChange);
    };
  }, []);

  // Load fresh from database always - no caching
  useEffect(() => {
    const loadCoverPhoto = async () => {
      if (!user) return;

      console.log('🖼️ Loading fresh cover photo from database');

      try {
        const selectCols = 'id, auth_user_id, user_id, cover_key, cover_photo_url, cover_image_url, cover_photo_position, cover_position, cover_gradient, updated_at';
        let profile: any = null;

        // Try by auth_user_id/id/user_id in public schema
        const tryFetch = async (schema: 'public' | 'api') => {
          let p: any = null;
          const c = supabase.schema(schema).from('profiles').select(selectCols);
          const byAuth = await c.eq('auth_user_id', user.id).maybeSingle();
          if (byAuth.data) p = byAuth.data;
          if (!p) {
            const byId = await supabase.schema(schema).from('profiles').select(selectCols).eq('id', user.id).maybeSingle();
            if (byId.data) p = byId.data;
          }
          if (!p) {
            const byUserId = await supabase.schema(schema).from('profiles').select(selectCols).eq('user_id', user.id).maybeSingle();
            if (byUserId.data) p = byUserId.data;
          }
          return p;
        };

        profile = await tryFetch('public');
        if (!profile) profile = await tryFetch('api');

        console.log('🔎 Cover DB row:', { schemaTried: profile ? 'found' : 'none', hasKey: !!profile?.cover_key, hasUrl: !!profile?.cover_photo_url });

        if (!profile) {
          try { 
            await supabase.schema('public').rpc('ensure_user_profile_exists', { user_uuid: user.id }); 
            console.warn('⚠️ Profile did not exist; created one.');
          } catch (e) { 
            console.warn('ensure_user_profile_exists failed:', e); 
          }
          return;
        }

        const urlField = profile.cover_key || profile.cover_photo_url || profile.cover_image_url || null;
        let position = profile.cover_photo_position || profile.cover_position || 'center center';
        const gradient = profile.cover_gradient || globalCoverGradient;

        // Normalize to vertical-only 'center N%'
        const mPos = /(-?\d+(?:\.\d+)?)%/.exec(String(position));
        position = mPos ? `center ${Math.round(parseFloat(mPos[1]))}%` : 'center 50%';

        notifyGlobalCoverGradientChange(gradient);

        if (urlField) {
          try {
            console.log('🔗 Resolving cover URL from key/url:', urlField);
            const displayUrl = await processWasabiUrl(urlField);
            console.log('✅ Resolved cover URL (first 120):', String(displayUrl).slice(0, 120));
            notifyGlobalCoverPhotoChange(displayUrl, position);
            await preloadImage(displayUrl);
          } catch (e) {
            console.warn('Cover preload failed; trying proxy fallback', e);
            try {
              const blob = await getWasabiProxyObjectUrl(urlField);
              console.log('✅ Proxy fallback URL generated');
              notifyGlobalCoverPhotoChange(blob, position);
            } catch (e2) {
              console.warn('Cover proxy fallback failed', e2);
            }
          }
        } else {
          console.log('ℹ️ No cover URL set in DB yet; checking local cache');
          try {
            const cachedRaw = user?.id ? localStorage.getItem(`cover:last:${user.id}`) : null;
            const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
            const cachedUrl = typeof cached?.url === 'string' ? cached.url : null;
            if (cachedUrl) {
              console.log('✅ Using cached cover from localStorage');
              notifyGlobalCoverPhotoChange(cachedUrl, position);
            } else {
              notifyGlobalCoverPhotoChange(null, position);
            }
          } catch (e) {
            console.warn('LocalStorage cover cache read failed:', e);
            notifyGlobalCoverPhotoChange(null, position);
          }
        }
      } catch (error: any) {
        console.error('Error loading cover photo:', error);
        toast.error(`Cover photo load error: ${error.message || error}`);
      }
    };

    loadCoverPhoto();
  }, [user]);

  // No auto-refresh needed - using live database state

  // Upload cover photo
  const uploadCover = async (file: File): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in to upload cover photo');
      return null;
    }

    try {
      console.log('🖼️ Uploading cover photo');
      
      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Cover photo file size must be less than 10MB');
        return null;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Cover photo must be an image file');
        return null;
      }

      notifyGlobalCoverLoadingChange(true);
      
      // Emit upload start event for animation
      window.dispatchEvent(new CustomEvent('cover-upload-start'));

      // Upload to Wasabi
      const { key } = await uploadToWasabi(file);
      console.log('✅ Cover photo uploaded:', key);

      // Save cover photo to user's photo collection
      try {
        const displayUrl = await processWasabiUrl(key);
        await userPhotosService.addPhoto(
          user.id,
          key,
          'cover',
          {
            photoUrl: displayUrl,
            originalFilename: file.name,
            fileSize: file.size,
            contentType: file.type,
            isCurrent: true
          }
        );
        console.log('✅ Cover photo saved to collection');
      } catch (e) {
        console.warn('⚠️ Failed to save cover photo to collection:', e);
      }

      // Update cover photo with position
      await updateCoverPhoto(key, coverPosition);
      
      toast.success('Cover photo updated successfully');
      return key;
    } catch (error) {
      console.error('❌ Error uploading cover photo:', error);
      toast.error('Failed to upload cover photo');
      return null;
    } finally {
      notifyGlobalCoverLoadingChange(false);
      
      // Emit upload end event for animation
      window.dispatchEvent(new CustomEvent('cover-upload-end'));
    }
  };

  // Update cover photo
  const updateCoverPhoto = async (newUrl: string | null, newPosition: string = 'center center') => {
    if (!user) return;

    console.log('🔄 Updating cover photo:', { newUrl, newPosition });

    notifyGlobalCoverLoadingChange(true);

    try {
      // Update UI immediately (preload to prevent flicker)
      const displayUrl = newUrl ? await processWasabiUrl(newUrl) : null;
      if (displayUrl) {
        try {
          await preloadImage(displayUrl);
          notifyGlobalCoverPhotoChange(displayUrl, newPosition);
        } catch (e) {
          console.warn('Cover preview preload failed; trying proxy fallback', e);
          try {
            const blob = await getWasabiProxyObjectUrl(newUrl!);
            notifyGlobalCoverPhotoChange(blob, newPosition);
          } catch {}
        }
      } else {
        notifyGlobalCoverPhotoChange(null, newPosition);
      }

      // No caching - save directly to database only

      // Persist via Edge Function (service role) and verify in API schema
      let persisted = false;
      try {
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('set-profile-cover', {
          body: { cover_key: newUrl, position: newPosition }
        });
        if (!fnErr && (fnData as any)?.success) {
          try {
            const selectCols = 'cover_key, cover_photo_url, cover_image_url';
            const tryVerify = async (column: 'auth_user_id' | 'id' | 'user_id') => {
              const { data } = await supabase
                .schema('api')
                .from('profiles')
                .select(selectCols)
                .eq(column, user.id)
                .maybeSingle();
              return data;
            };
            const verified = await tryVerify('auth_user_id') || await tryVerify('id') || await tryVerify('user_id');
            const got = verified?.cover_key || verified?.cover_photo_url || verified?.cover_image_url;
            if (got) persisted = true;
          } catch {}
        } else {
          console.warn('Edge function persist failed:', fnErr, fnData);
        }
      } catch (e) {
        console.warn('Edge function invocation threw:', e);
      }

      const mirrorPayload = {
        cover_key: newUrl,
        cover_photo_url: newUrl,
        cover_image_url: newUrl,
        updated_at: new Date().toISOString()
      };

      if (!persisted) {
        // Fall back to direct update sequence against API schema
        let saved = false;
        const columns: Array<'auth_user_id' | 'id' | 'user_id'> = ['auth_user_id', 'id', 'user_id'];
        for (const column of columns) {
          try {
            const { data, error } = await supabase
              .schema('api')
              .from('profiles')
              .update(mirrorPayload)
              .eq(column, user.id)
              .select('id')
              .maybeSingle();
            if (!error && data) { saved = true; break; }
          } catch {}
        }
        if (!saved) {
          try {
            const { error: insertErr } = await supabase
              .schema('api')
              .from('profiles')
              .insert({
                auth_user_id: user.id,
                user_id: user.id,
                ...mirrorPayload,
                created_at: new Date().toISOString()
              });
            if (!insertErr) saved = true;
          } catch {}
        }
        if (!saved) throw new Error('Failed to persist cover via fallback');
        persisted = true;
      }

      // Mirror to api.profiles best-effort
      try {
        await supabase
          .schema('api')
          .from('profiles')
          .update(mirrorPayload)
          .eq('auth_user_id', user.id);
      } catch {}

      // UI update
      notifyGlobalCoverPhotoChange(displayUrl, newPosition);
    } catch (error) {
      console.error('Error updating cover photo:', error);
      toast.error('Failed to update cover photo');
    } finally {
      notifyGlobalCoverLoadingChange(false);
    }
  };

  // Update cover photo position only
  const updateCoverPosition = async (newPosition: string) => {
    if (!user) return;

    console.log('🔄 Updating cover position:', newPosition);

    try {
      // Update UI immediately
      notifyGlobalCoverPhotoChange(coverPhotoUrl, newPosition);

      // Save to database with robust fallbacks
      const positionPayload = {
        cover_photo_position: newPosition,
        cover_position: newPosition,
        updated_at: new Date().toISOString()
      };
      let posSaved = false;
      const posColumns: Array<'auth_user_id' | 'id' | 'user_id'> = ['auth_user_id', 'id', 'user_id'];
      for (const column of posColumns) {
        try {
          const { data, error } = await supabase
            .schema('public')
            .from('profiles')
            .update(positionPayload)
            .eq(column, user.id)
            .select('id')
            .maybeSingle();
          if (!error && data) {
            posSaved = true;
            break;
          }
        } catch {}
      }
      if (!posSaved) {
        // Try api schema as well
        for (const column of posColumns) {
          try {
            const { data, error } = await supabase
              .schema('api')
              .from('profiles')
              .update(positionPayload)
              .eq(column, user.id)
              .select('id')
              .maybeSingle();
            if (!error && data) { posSaved = true; break; }
          } catch {}
        }
      }
    } catch (error) {
      console.error('Error updating cover position:', error);
      toast.error('Failed to update cover position');
    }
  };

  // Update cover photo gradient
  const updateCoverGradient = async (newGradient: string) => {
    if (!user) return;

    console.log('🔄 Updating cover gradient:', newGradient);

    try {
      // Update UI immediately
      notifyGlobalCoverGradientChange(newGradient);

      // Save to database
      const { error } = await supabase
        .schema('public')
        .from('profiles')
        .update({ 
          cover_gradient: newGradient,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id);

      if (error) {
        console.error('Failed to save cover gradient:', error);
        toast.error('Failed to save cover gradient');
      } else {
        console.log('✅ Cover gradient saved to database');
      }
    } catch (error) {
      console.error('Error updating cover gradient:', error);
      toast.error('Failed to update cover gradient');
    }
  };

  return {
    coverPhotoUrl,
    coverPosition,
    coverGradient,
    isLoading,
    uploadCover,
    updateCoverPhoto,
    updateCoverPosition,
    updateCoverGradient
  };
};