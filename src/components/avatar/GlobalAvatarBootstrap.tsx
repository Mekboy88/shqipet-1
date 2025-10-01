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
        }
      };
    }
  }, [user?.id]);

  return null; // This is a bootstrap component, renders nothing
};

export default GlobalAvatarBootstrap;