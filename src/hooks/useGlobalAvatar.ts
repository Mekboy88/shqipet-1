/**
 * useGlobalAvatar - Standalone avatar hook (no circular deps)
 * - Fetches avatar_url directly from backend
 * - Provides upload via the new AvatarUploadService
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { avatarUploadService } from '@/services/avatar/AvatarUploadService';

export const useGlobalAvatar = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id || null;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load avatar_url directly from profiles to avoid circular hooks
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!targetUserId) {
        setAvatarUrl(null);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', targetUserId)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled) {
          setAvatarUrl((data?.avatar_url as string) || null);
        }
      } catch (err) {
        if (!cancelled) {
          setAvatarUrl(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [targetUserId]);

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!targetUserId) throw new Error('No user');
    const result = await avatarUploadService.upload(file, targetUserId);
    const newUrl = result.url || result.key || null;
    setAvatarUrl(newUrl);
    return newUrl;
  }, [targetUserId]);

  return {
    avatarUrl,
    isLoading: loading,
    uploadProgress: 0,
    uploadAvatar,
    updateAvatar: async (_newUrl: string | null) => {
      console.warn('updateAvatar with URL not supported - use uploadAvatar with File');
    }
  };
};
