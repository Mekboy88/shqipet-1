/**
 * useGlobalAvatar - Routes to unified AvatarV2 system
 * Single source of truth for all avatar functionality
 */

import { useAvatarV2 } from './avatar/useAvatarV2';

export const useGlobalAvatar = (userId?: string) => {
  const { url, lastGoodUrl, key, loading, uploading, upload, uploadProgress } = useAvatarV2(userId);
  
  return {
    avatarUrl: url || lastGoodUrl,
    avatarKey: key || null,
    isLoading: loading || uploading,
    uploadProgress,
    uploadAvatar: upload,
    updateAvatar: async (_newUrl: string | null) => {
      // URL-based updates are not supported here; use uploadAvatar with a File
    }
  };
};
