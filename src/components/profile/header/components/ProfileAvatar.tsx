import { useState } from 'react';
import Avatar from '@/components/Avatar';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';

interface ProfileAvatarProps {
  userId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

/**
 * Profile Avatar with Upload Capability
 * Uses the new crystal-clear avatar system
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  userId,
  size = 'xl',
  className = ''
}) => {
  const { upload, uploading, progress } = useAvatarUpload();
  const [showUpload, setShowUpload] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await upload(file);
    }
  };

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShowUpload(true)}
      onMouseLeave={() => setShowUpload(false)}
    >
      <Avatar 
        userId={userId}
        size={size}
        className="w-full h-full"
      />
      
      {/* Upload Overlay */}
      {showUpload && !uploading && (
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer">
          <label htmlFor={`avatar-upload-${userId}`} className="cursor-pointer">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </label>
          <input
            id={`avatar-upload-${userId}`}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mb-2 relative">
              <div className="absolute inset-0 rounded-full border-4 border-white/30"></div>
              <div 
                className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin"
              ></div>
            </div>
            <span className="text-sm text-white font-medium">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
