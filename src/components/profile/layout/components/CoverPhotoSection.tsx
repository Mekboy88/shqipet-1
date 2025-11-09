
import React, { useEffect, useState } from 'react';
import { useCoverPhotoDrag } from './cover-photo/hooks/useCoverPhotoDrag';
import CoverPhotoContent from './cover-photo/CoverPhotoContent';
import ProfileNavigationTabs from './cover-photo/ProfileNavigationTabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useAuth();
  const [showCoverControls, setShowCoverControls] = useState(true);

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

  // Load show_cover_controls preference from database
  useEffect(() => {
    if (!user?.id || !isOwnProfile) return;
    
    const loadControlsPreference = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('show_cover_controls')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        setShowCoverControls(data.show_cover_controls ?? true);
      }
    };
    
    loadControlsPreference();
  }, [user?.id, isOwnProfile]);

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

        {/* Profile Info Section - MATCHES COVER WIDTH */}
        <ProfileNavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </>
  );
};

export default CoverPhotoSection;
