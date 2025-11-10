import { useState } from 'react';
import { avatarUploadService } from '@/services/avatar/AvatarUploadService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Hook for uploading high-quality avatars
 * Includes validation and protection against blur
 */
export const useAvatarUpload = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File): Promise<string | null> => {
    if (!user) {
      toast.error('Authentication required');
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await avatarUploadService.upload(file, user.id);

      clearInterval(progressInterval);
      setProgress(100);

      toast.success('Avatar uploaded successfully!');
      
      // Refresh page to show new avatar
      setTimeout(() => {
        window.location.reload();
      }, 500);

      return result.key;
    } catch (error) {
      console.error('Upload failed:', error);
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    upload,
    uploading,
    progress
  };
};
