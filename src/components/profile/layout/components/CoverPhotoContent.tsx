
import React, { useEffect, useState } from 'react';
import Avatar from '@/components/Avatar';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import { useCover } from '@/hooks/media/useCover';
import CoverPhotoOverlay from './cover-photo/CoverPhotoOverlay';
import CoverPhotoControls from './cover-photo/CoverPhotoControls';
import { mediaService } from '@/services/media/MediaService';

interface CoverPhotoContentProps {
  coverPhotoUrl: string;
  isDragMode: boolean;
  isDragging: boolean;
  isSaving?: boolean;
  coverRef: React.RefObject<HTMLDivElement>;
  onDragModeToggle: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  onEditCoverClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
}

const CoverPhotoContent: React.FC<CoverPhotoContentProps> = ({
  coverPhotoUrl,
  isDragMode,
  isDragging,
  isSaving,
  coverRef,
  onDragModeToggle,
  onSaveChanges,
  onCancelChanges,
  onEditCoverClick,
  onMouseDown,
  onMouseMove,
  onMouseUp
}) => {
  const { displayName } = useUniversalUser();
  const { position: coverPosition, isPositionChanging } = useCover(); // Use unified cover position
  
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);

  // Position is managed by useCover - no local state needed

  useEffect(() => {
    let cancelled = false;
    const input = coverPhotoUrl;
    if (!input) {
      setDisplayUrl(null);
      return;
    }
    const isDirect = /^(https?:|blob:|data:)/.test(input);
    if (isDirect) {
      setDisplayUrl(input);
      return;
    }
    mediaService
      .getUrl(input)
      .then((url) => {
        if (!cancelled) setDisplayUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDisplayUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [coverPhotoUrl]);

  return (
    <div 
      ref={coverRef}
      className="h-[500px] relative rounded-b-2xl mx-auto max-w-[1200px] w-full bg-muted" 
      style={{
        ...(displayUrl ? { backgroundImage: `url(${displayUrl})` } : {}),
        backgroundSize: 'cover',
        backgroundPosition: displayUrl ? coverPosition : 'center',
        cursor: isDragMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
        // Smooth transitions when not dragging or changing position
        transition: (isDragMode || isDragging || isPositionChanging) ? 'none' : 'background-position 0.3s ease, cursor 0.2s ease'
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <CoverPhotoOverlay isDragMode={isDragMode} />

      <CoverPhotoControls
        isDragMode={isDragMode}
        isSaving={isSaving ?? false}
        onDragModeToggle={onDragModeToggle}
        onSaveChanges={onSaveChanges}
        onCancelChanges={onCancelChanges}
        onEditCoverClick={onEditCoverClick}
        onMouseDown={onMouseDown}
      />

      {/* Profile Picture - positioned at bottom left with hover icons enabled */}
      <div className="absolute bottom-4 left-4">
        <Avatar 
          size="2xl"
          className="w-40 h-40 border-4 border-white"
        />
      </div>

      {/* User Info - positioned on the right side next to profile picture */}
      <div className="absolute bottom-8 left-48 pt-4">
        <h1 className="font-bold text-white mb-1 text-3xl">
          {displayName || ''}
        </h1>
      </div>
    </div>
  );
};

export default CoverPhotoContent;
