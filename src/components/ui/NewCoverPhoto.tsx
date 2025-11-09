/**
 * NewCoverPhoto - Clean cover photo component using new media system
 * Replaces all old cover components with unified behavior
 */

import React from 'react';
import { useCover } from '@/hooks/media/useCover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { mediaService } from '@/services/media/MediaService';

interface NewCoverPhotoProps {
  userId?: string;
  className?: string;
  height?: number;
  showLoading?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

interface CoverSizes {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
  original?: string;
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

  // Use only real HTTP URLs (never blobs/data URIs) - memoized
  const displayUrl = React.useMemo(() => {
    const httpOnly = (u?: string | null) => (u && /^https?:/.test(u)) ? u : null;
    return httpOnly(resolvedUrl) || httpOnly(lastGoodUrl);
  }, [resolvedUrl, lastGoodUrl]);

  // Fetch cover_sizes from database for srcset - auto-parse userId from coverUrl if not provided
  const [coverSizes, setCoverSizes] = React.useState<CoverSizes | null>(null);
  React.useEffect(() => {
    const parseUserId = (url: string): string | null => {
      const match = url?.match(/covers\/([a-f0-9-]+)\//);
      return match ? match[1] : null;
    };

    const effectiveUserId = userId || (resolvedUrl ? parseUserId(resolvedUrl) : null);
    if (!effectiveUserId) return;

    const fetchSizes = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('cover_sizes')
          .eq('id', effectiveUserId)
          .maybeSingle();
        
        if (data?.cover_sizes && typeof data.cover_sizes === 'object') {
          setCoverSizes(data.cover_sizes as CoverSizes);
          console.log('🖼️ Cover sizes loaded for srcset:', data.cover_sizes);
        }
      } catch (e) {
        console.warn('Failed to fetch cover_sizes:', e);
      }
    };
    fetchSizes();
  }, [userId, resolvedUrl]);

  // Resolve cover sizes to URLs for srcset
  const [resolvedSrcSet, setResolvedSrcSet] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    if (!coverSizes || Object.keys(coverSizes).length === 0) {
      setResolvedSrcSet(undefined);
      return;
    }

    const resolveSizes = async () => {
      try {
        const sizeMap: Record<string, number> = {
          thumbnail: 800,
          small: 1200,
          medium: 1600,
          large: 2400,
          original: 3200
        };

        const srcSetEntries: string[] = [];

        for (const [sizeKey, storageKey] of Object.entries(coverSizes)) {
          const width = sizeMap[sizeKey];
          if (width && storageKey) {
            try {
              const url = await mediaService.getUrl(storageKey);
              srcSetEntries.push(`${url} ${width}w`);
            } catch (e) {
              console.warn('Failed to resolve cover srcSet key:', storageKey, e);
            }
          }
        }

        if (srcSetEntries.length > 0) {
          setResolvedSrcSet(srcSetEntries.join(', '));
          console.log('🖼️ Generated cover srcset for crisp display');
        }
      } catch (e) {
        console.warn('Failed to process cover srcSet:', e);
      }
    };

    resolveSizes();
  }, [coverSizes]);

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
          srcSet={resolvedSrcSet}
          sizes="100vw"
          alt="Cover photo"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ 
            objectPosition: position,
            imageRendering: '-webkit-optimize-contrast'
          }}
          loading="eager"
          onError={() => { try { loadCover?.(); } catch {} }}
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
});

NewCoverPhoto.displayName = 'NewCoverPhoto';

export default NewCoverPhoto;