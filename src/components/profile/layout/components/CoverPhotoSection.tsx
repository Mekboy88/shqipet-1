
import React from 'react';
import { useCoverPhotoDrag } from './cover-photo/hooks/useCoverPhotoDrag';
import CoverPhotoContent from './cover-photo/CoverPhotoContent';
import ProfileNavigationTabs from './cover-photo/ProfileNavigationTabs';

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
        />

        {/* Profile Info Section - MATCHES COVER WIDTH */}
        <ProfileNavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </>
  );
};

export default CoverPhotoSection;
