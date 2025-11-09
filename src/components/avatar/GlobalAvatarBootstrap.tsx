/**
 * GlobalAvatarBootstrap - Ensures avatar system is initialized globally
 */

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { avatarStore } from '@/services/avatar/AvatarStore';

const GlobalAvatarBootstrap = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      console.log('🚀 GlobalAvatarBootstrap: Loading avatar for authenticated user', user.id);
      // Ensure avatar is loaded immediately when user is available
      avatarStore.load(user.id);
    }
  }, [user?.id]);

  // Listen for visibility changes to optionally refresh stale avatars (throttled)
  useEffect(() => {
    const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

    const handleVisibilityChange = () => {
      if (document.hidden || !user?.id) return;

      const lastMap = ((window as any).__avatarLastVisibleRefresh ||= {});
      const last = lastMap[user.id] || 0;
      const recentUpload = (window as any).__avatarUploadTimestamp?.[user.id] || 0;

      // Skip if refreshed recently or right after an upload
      if (Date.now() - last < REFRESH_INTERVAL_MS) return;
      if (Date.now() - recentUpload < 60 * 1000) return;

      console.log('🔄 GlobalAvatarBootstrap: Page visible, refreshing avatar (throttled)');
      lastMap[user.id] = Date.now();
      avatarStore.load(user.id);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  // Setup global debug commands
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__avatarV2 = {
        reload: (userId?: string) => {
          const targetId = userId || user?.id;
          if (targetId) {
            console.log('🔄 Manual avatar reload for:', targetId);
            avatarStore.load(targetId);
          }
        },
        print: (userId?: string) => {
          const targetId = userId || user?.id;
          if (targetId) {
            console.log('📊 Avatar state for user:', targetId);
            console.table((window as any).__avatarV2Debug?.[targetId] || 'No state found');
          }
        },
        clearCache: () => {
          const keys = Object.keys(localStorage).filter(k => k.startsWith('avatar_cache_'));
          keys.forEach(k => localStorage.removeItem(k));
          console.log('🧹 Cleared avatar cache:', keys.length, 'items');
        },
        upload: async (fileOrUrl?: File | string) => {
          const targetId = user?.id;
          if (!targetId) {
            console.error('❌ No user logged in');
            return;
          }
          
          if (!fileOrUrl) {
            // Open file picker
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e: any) => {
              const file = e.target?.files?.[0];
              if (file) {
                console.log('📤 Uploading avatar:', file.name);
                try {
                  const key = await avatarStore.upload(targetId, file);
                  console.log('✅ Avatar uploaded:', key);
                } catch (err: any) {
                  console.error('❌ Upload failed:', err?.message || err);
                }
              }
            };
            input.click();
            return;
          }
          
          // Handle File object
          if (fileOrUrl instanceof File) {
            console.log('📤 Uploading avatar:', fileOrUrl.name);
            try {
              const key = await avatarStore.upload(targetId, fileOrUrl);
              console.log('✅ Avatar uploaded:', key);
            } catch (err: any) {
              console.error('❌ Upload failed:', err?.message || err);
            }
            return;
          }
          
          // Handle URL (fetch and convert to File)
          if (typeof fileOrUrl === 'string') {
            console.log('📥 Fetching image from URL:', fileOrUrl);
            try {
              const response = await fetch(fileOrUrl);
              const blob = await response.blob();
              const filename = fileOrUrl.split('/').pop() || 'avatar.jpg';
              const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
              console.log('📤 Uploading avatar from URL:', filename);
              const key = await avatarStore.upload(targetId, file);
              console.log('✅ Avatar uploaded:', key);
            } catch (err: any) {
              console.error('❌ Upload from URL failed:', err?.message || err);
            }
          }
        },
        help: () => {
          console.log(`
🎨 Avatar Console Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

__avatarV2.upload()              - Open file picker to upload avatar
__avatarV2.upload(file)          - Upload a File object
__avatarV2.upload('https://...')  - Upload from URL
__avatarV2.reload()              - Reload avatar from database
__avatarV2.print()               - Print current avatar state
__avatarV2.clearCache()          - Clear all avatar caches
__avatarV2.help()                - Show this help message

Examples:
  __avatarV2.upload()
  __avatarV2.upload('https://example.com/photo.jpg')
          `);
        }
      };
      
      // Auto-show help on first load
      console.log('💡 Type __avatarV2.help() for avatar console commands');
    }
  }, [user?.id]);

  return null; // This is a bootstrap component, renders nothing
};

export default GlobalAvatarBootstrap;