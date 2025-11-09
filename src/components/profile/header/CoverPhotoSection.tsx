import React from 'react';
import NewCoverUploader from '@/components/profile/NewCoverUploader';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useCoverControlsPreference } from '@/hooks/useCoverControlsPreference';
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
  const { value: showCoverControls, setValue: setShowCoverControls } = useCoverControlsPreference();
  return (
    <div className="flex justify-center w-full">
      <div className="w-[54%] relative group">
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
        {targetUserId === user?.id && (
          showCoverControls ? (
            <button
              onClick={() => setShowCoverControls(false)}
              aria-pressed={true}
              title="Hide cover controls"
              className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border-border shadow-sm hover:bg-background/90 hover:shadow transition-all md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Hide cover controls
            </button>
          ) : (
            <button
              onClick={() => setShowCoverControls(true)}
              aria-pressed={false}
              title="Show cover controls"
              className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border-border shadow-sm hover:bg-background/90 hover:shadow transition-all md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
            >
              <Eye className="w-3.5 h-3.5" />
              Show cover controls
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default CoverPhotoSection;
