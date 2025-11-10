import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import { mediaService } from '@/services/media/MediaService';

interface AvatarProps {
  userId?: string;
  src?: string | null;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  style?: React.CSSProperties;
}

const sizePixels: Record<NonNullable<AvatarProps['size']>, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 80,
};

const textSizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'text-[10px]',
  sm: 'text-[11px]',
  md: 'text-[12px]',
  lg: 'text-[14px]',
  xl: 'text-[16px]',
  '2xl': 'text-[20px]',
};

/**
 * Crystal-clear Avatar component with blur protection
 * - Always renders images at native resolution
 * - No blur, no optimization artifacts
 * - Fallback to initials if image fails
 */
const Avatar: React.FC<AvatarProps> = ({
  userId,
  src,
  initials,
  size = 'md',
  className,
  style,
}) => {
  const { firstName, lastName, initials: derivedInitials, avatarUrl } = useUniversalUser(userId);
  const [imageError, setImageError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  // Determine final image URL (could be a storage key or a full URL)
  const finalImageUrl = (src || avatarUrl || null) as string | null;

  // Resolve storage keys (avatars/, uploads/, covers/) to displayable URLs
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!finalImageUrl) {
        setResolvedUrl(null);
        return;
      }
      // If it's already a full URL or blob/data, use directly
      if (/^(https?:|blob:|data:)/i.test(finalImageUrl)) {
        setResolvedUrl(finalImageUrl);
        return;
      }
      try {
        const url = await mediaService.getUrl(finalImageUrl);
        if (!cancelled) setResolvedUrl(url);
      } catch (e) {
        console.warn('Failed to resolve media URL for avatar:', finalImageUrl, e);
        if (!cancelled) setResolvedUrl(null);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [finalImageUrl]);
  
  // Determine final initials
  const nameInitials = firstName && lastName
    ? `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`
    : '';
  const finalInitials = (initials || derivedInitials || nameInitials || '??').trim();

  const pixelSize = sizePixels[size] || sizePixels.md;
  const textClass = textSizeClasses[size] || textSizeClasses.md;

  // Show image if we have a resolved URL and no error
  const shouldShowImage = !!resolvedUrl && !imageError;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center select-none overflow-hidden',
        'bg-muted text-muted-foreground',
        textClass,
        className
      )}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        minWidth: `${pixelSize}px`,
        minHeight: `${pixelSize}px`,
        ...style,
      }}
      aria-label={shouldShowImage ? "User avatar" : "User avatar placeholder"}
    >
      {shouldShowImage ? (
        <img
          src={resolvedUrl || undefined}
          alt="Avatar"
          className="w-full h-full object-cover"
          style={{
            imageRendering: 'crisp-edges',
            // Force native resolution rendering - NO BLUR
            width: '100%',
            height: '100%',
          }}
          onError={() => {
            console.warn('Avatar image failed to load, showing initials fallback');
            setImageError(true);
          }}
          loading="eager"
          draggable={false}
        />
      ) : (
        <span className="font-semibold" style={{ lineHeight: 1 }}>
          {finalInitials}
        </span>
      )}
    </div>
  );
};

export default React.memo(Avatar);
