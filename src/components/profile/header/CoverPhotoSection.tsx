import React from 'react';
import NewCoverUploader from '@/components/profile/NewCoverUploader';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
interface CoverPhotoSectionProps {
  coverPhotoUrl: string;
  onEditClick: () => void;
}

const CoverPhotoSection: React.FC<CoverPhotoSectionProps> = ({
  coverPhotoUrl,
  onEditClick
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const uidParam = (() => { try { return new URLSearchParams(location.search).get('uid'); } catch { return null; } })();
  const targetUserId = uidParam || user?.id;
  return (
    <div className="flex justify-center w-full">
      <div className="w-[54%]">
        <NewCoverUploader 
          userId={targetUserId}
          height={500}
          className="rounded-b-xl shadow-lg"
        >
          {/* Profile Avatar positioned at bottom left */}
          <div className="absolute bottom-4 left-6">
            <Avatar 
              userId={targetUserId}
              size="xl"
              className="w-40 h-40 shadow-lg"
              enableUpload={true}
              showCameraOverlay={true}
            />
          </div>
        </NewCoverUploader>
      </div>
    </div>
  );
};

export default CoverPhotoSection;
