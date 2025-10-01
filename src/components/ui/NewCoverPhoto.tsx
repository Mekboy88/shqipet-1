/**
 * NewCoverPhoto - Clean cover photo component using new media system
 * Replaces all old cover components with unified behavior
 */

import React from 'react';
import { useCover } from '@/hooks/media/useCover';
import { cn } from '@/lib/utils';
import LoadingDots from './LoadingDots';
import UploadAnimation from '@/components/ui/UploadAnimation';

interface NewCoverPhotoProps {
  userId?: string;
  className?: string;
  height?: number;
  showLoading?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const NewCoverPhoto: React.FC<NewCoverPhotoProps> = ({
  userId,
  className,
  height = 500,
  showLoading = true,
  children,
  style,
  onMouseMove
}) => {
  const { resolvedUrl, position, loading, lastGoodUrl } = useCover(userId);

  // UI Debug toggle: enable via ?coverDebug=1 or localStorage.setItem('coverDebug','1')
  const [debugEnabled, setDebugEnabled] = React.useState(false);
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('coverDebug') || params.get('avatarDebug');
      const s = localStorage.getItem('coverDebug') || localStorage.getItem('avatarDebug');
      setDebugEnabled(q === '1' || q === 'true' || s === '1' || s === 'true');
    } catch (e) {
      // ignore
    }
  }, []);

  // Use resolved URL or fall back to last good URL
  const displayUrl = resolvedUrl || lastGoodUrl;

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-gray-200',
        className
      )}
      style={{ 
        height: `${height}px`,
        ...style
      }}
      onMouseMove={onMouseMove}
    >
      {/* Render actual image as layer to avoid CSS/background inconsistencies across panes */}
      {displayUrl && (
        <img
          src={displayUrl}
          alt="Cover photo"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: position }}
          onError={() => { /* silently ignore */ }}
        />
      )}
      {/* Blue tint overlay - 10% */}
      <div className="absolute inset-0 bg-blue-500/[0.10]"></div>

      {/* Content (avatar, controls, etc.) */}
      {children}

      {debugEnabled && (
        <div className="absolute bottom-1 left-1 px-2 py-1 rounded-md text-[10px] leading-tight shadow border bg-background text-foreground/80 max-w-[300px] z-10">
          <div className="font-medium">CoverDebug</div>
          <div>userId: {userId || '(current user)'}</div>
          <div>loading: {String(loading)}</div>
          <div>position: {position}</div>
          <div>resolvedUrl: {resolvedUrl ? resolvedUrl.slice(0, 100) : 'null'}</div>
          <div>lastGoodUrl: {lastGoodUrl ? lastGoodUrl.slice(0, 100) : 'null'}</div>
        </div>
      )}
    </div>
  );
};

export default NewCoverPhoto;