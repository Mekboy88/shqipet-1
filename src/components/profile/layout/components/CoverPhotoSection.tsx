
import React from 'react';
import { useCoverPhotoDrag } from './cover-photo/hooks/useCoverPhotoDrag';
import CoverPhotoContent from './cover-photo/CoverPhotoContent';
import ProfileNavigationTabs from './cover-photo/ProfileNavigationTabs';
import { useCoverControlsPreference } from '@/hooks/useCoverControlsPreference';
import { Eye, EyeOff } from 'lucide-react';

interface CoverPhotoSectionProps {
  coverPhotoUrl: string;
  onEditCoverClick: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  isOwnProfile?: boolean;
}

const CoverPhotoSection: React.FC<CoverPhotoSectionProps> = ({
  coverPhotoUrl,
  onEditCoverClick,
  activeTab,
  setActiveTab,
  isOwnProfile = true
}) => {
  const { value: showCoverControls, setValue: setShowCoverControls } = useCoverControlsPreference();

  const {
    isDragging,
    isDragMode,
    isSaving,
    coverRef,
    buttonColor,
    handleDragModeToggle,
    handleSaveChanges,
    handleCancelChanges,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleButtonColorChange
  } = useCoverPhotoDrag();

  return (
    <>
      <div className="w-full relative my-[56px]">
        {/* Cover Photo - SIMPLE FLEXIBLE WIDTH */}
        <CoverPhotoContent
          coverPhotoUrl={coverPhotoUrl}
          isDragMode={isDragMode}
          isDragging={isDragging}
          isSaving={isSaving}
          coverRef={coverRef}
          buttonColor={buttonColor}
          onDragModeToggle={handleDragModeToggle}
          onSaveChanges={handleSaveChanges}
          onCancelChanges={handleCancelChanges}
          onEditCoverClick={onEditCoverClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onButtonColorChange={handleButtonColorChange}
          isOwnProfile={isOwnProfile}
          showControls={showCoverControls}
        />

        {/* Quick controls toggle — independent of settings panel */}
        {isOwnProfile && (
          showCoverControls ? (
            <button
              onClick={() => setShowCoverControls(false)}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background/90 transition-all text-xs font-medium flex items-center gap-1.5 shadow-sm"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Hide cover controls
            </button>
          ) : (
            <button
              onClick={() => setShowCoverControls(true)}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background/90 transition-all text-xs font-medium flex items-center gap-1.5 shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              Show cover controls
            </button>
          )
        )}


        {/* Profile Info Section - MATCHES COVER WIDTH */}
        <ProfileNavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </>
  );
};

export default CoverPhotoSection;
