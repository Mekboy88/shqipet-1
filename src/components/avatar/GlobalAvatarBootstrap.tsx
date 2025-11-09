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

  // Setup global debug commands (removed for security)
  useEffect(() => {
    // No browser console access for security reasons
  }, [user?.id]);

  return null; // This is a bootstrap component, renders nothing
};

export default GlobalAvatarBootstrap;