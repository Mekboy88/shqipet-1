/**
 * useGlobalAvatar - Simple avatar hook
 * Direct access to avatar URL from user profile
 */

import { useUniversalUser } from './useUniversalUser';

export const useGlobalAvatar = (userId?: string) => {
  const { avatarUrl } = useUniversalUser(userId);
  
  return {
    avatarUrl,
    isLoading: false,
    uploadProgress: 0,
    uploadAvatar: async (file: File) => {
      console.warn('Use useAvatarUpload hook for uploading');
      return null;
    },
    updateAvatar: async (newUrl: string | null) => {
      console.warn('Use useAvatarUpload hook for updating');
    }
  };
};
