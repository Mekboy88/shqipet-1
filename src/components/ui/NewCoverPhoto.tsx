/**
 * NewCoverPhoto - Clean cover photo component using new media system
 * Replaces all old cover components with unified behavior
 */

import React from 'react';
import { useCover } from '@/hooks/media/useCover';
import { cn } from '@/lib/utils';

interface NewCoverPhotoProps {
  userId?: string;
  className?: string;
  height?: number;
  showLoading?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const NewCoverPhoto: React.FC<NewCoverPhotoProps> = React.memo(({
  userId,
  className,
  height = 500,
  showLoading = true,
  children,
  style,
  onMouseMove
}) => {
  const { resolvedUrl, position, loading, lastGoodUrl, loadCover } = useCover(userId);

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

  // Allow HTTP URLs, blob URLs, and data URIs - memoized
  const displayUrl = React.useMemo(() => {
    const pick = (u?: string | null) =>
      u && (/^https?:/.test(u) || u.startsWith('blob:') || u.startsWith('data:')) ? u : null;
    return pick(resolvedUrl) || pick(lastGoodUrl);
  }, [resolvedUrl, lastGoodUrl]);

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
      {/* Render actual image with sharp positioning (same technique as avatar fix) */}
      {displayUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={displayUrl}
            alt="Cover photo"
            className="absolute w-auto h-auto"
            style={{ 
              minWidth: '100%',
              minHeight: '100%',
              objectFit: 'cover',
              objectPosition: position,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              imageRendering: 'crisp-edges'
            }}
            onError={() => { try { loadCover?.(); } catch {} }}
          />
        </div>
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
});

NewCoverPhoto.displayName = 'NewCoverPhoto';

export default NewCoverPhoto;