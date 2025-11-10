/**
 * useGlobalAvatar - Routes to unified AvatarV2 system
 * Single source of truth for all avatar functionality
 */

import { useAvatarV2 } from './avatar/useAvatarV2';
import { useEffect } from 'react';

export const useGlobalAvatar = (userId?: string) => {
  const { url, lastGoodUrl, loading, uploading, upload, uploadProgress } = useAvatarV2(userId);
  
  // Debug and fix corrupted avatar URLs
  const debugUrl = url || lastGoodUrl;
  useEffect(() => {
    try {
      console.log('🧪 GlobalAvatarV2Compat', { 
        userId, 
        url: debugUrl, 
        loading, 
        uploading,
        isCorrupted: debugUrl && !debugUrl.startsWith('http') && !debugUrl.startsWith('blob:') && !debugUrl.startsWith('data:')
      });
      (window as any).__avatarCompat = { userId, url: debugUrl, loading, uploading, ts: Date.now() };
      
      // If we have a corrupted URL (not a proper URL), clear it
      if (debugUrl && !debugUrl.startsWith('http') && !debugUrl.startsWith('blob:') && !debugUrl.startsWith('data:')) {
        console.warn('🚨 Detected corrupted avatar URL, clearing:', debugUrl);
      }
    } catch {}
  }, [userId, debugUrl, loading, uploading]);
  
  return {
    avatarUrl: url || lastGoodUrl,
    isLoading: loading || uploading,
    uploadProgress,
    uploadAvatar: upload,
    updateAvatar: async (newUrl: string | null) => {
      console.warn('updateAvatar with URL not supported - use uploadAvatar with File');
    }
  };
};