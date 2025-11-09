
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
      <div className="w-full relative my-[56px] group">
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
              aria-pressed={true}
              title="Hide cover controls"
              className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border-border shadow-sm hover:bg-background/90 hover:shadow transition-all"
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


        {/* Profile Info Section - MATCHES COVER WIDTH */}
        <ProfileNavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </>
  );
};

export default CoverPhotoSection;
