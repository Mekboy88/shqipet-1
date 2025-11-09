import React, { useRef, useState, useEffect } from 'react';
import { Avatar as BaseAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import { useGlobalAvatar } from '@/hooks/useGlobalAvatar';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { mediaService } from '@/services/media/MediaService';
import { supabase } from '@/integrations/supabase/client';

interface AvatarProps {
  userId?: string;
  src?: string | null;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  style?: React.CSSProperties;
  enableUpload?: boolean;
  showCameraOverlay?: boolean;
  isOwnProfile?: boolean;
}

// Size classes mapping for consistent sizing
const sizeClasses: Record<AvatarProps['size'] & string, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm', 
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl'
};

const Avatar: React.FC<AvatarProps> = React.memo(({
  userId,
  src,
  initials,
  size = 'md',
  className,
  style,
  enableUpload = false,
  showCameraOverlay = false,
  isOwnProfile = true
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const { firstName, lastName, initials: derivedInitials, username, email, avatarUrl: universalAvatarUrl } = useUniversalUser(userId);
  const { user: authUser } = useAuth();
  const { avatarUrl: globalAvatarUrl, isLoading, uploadAvatar } = useGlobalAvatar(userId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Memoize raw source to prevent unnecessary re-renders and re-resolutions
  const authAvatarUrl = (typeof authUser?.user_metadata?.avatar_url === 'string') 
    ? (authUser?.user_metadata?.avatar_url as string)
    : null;
  
  const rawSrcRef = useRef<string | null>(null);
  const rawSrc = src || globalAvatarUrl || authAvatarUrl || universalAvatarUrl || null;
  
  // Only update if actually changed to prevent flickering
  if (rawSrc !== rawSrcRef.current && rawSrc) {
    rawSrcRef.current = rawSrc;
  }

  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [lastDisplayedSrc, setLastDisplayedSrc] = useState<string | null>(() => {
    const candidate = rawSrc;
    if (!candidate) return null;
    if (/^(https?:|blob:|data:)/.test(candidate)) return candidate;
    if (/^(uploads|avatars|covers)\//i.test(candidate)) {
      try {
        const raw = localStorage.getItem(`media:last:${candidate}`);
        if (raw) {
          const j = JSON.parse(raw);
          if (typeof j?.url === 'string') return j.url as string;
        }
      } catch {}
    }
    return null;
  });
  // Keep the underlying storage key (when rawSrc is a key) to allow refresh on image error
  const rawKeyRef = useRef<string | null>(null);
  // Prevent infinite error loops by limiting retries
  const errorRetryRef = useRef<number>(0);

  // Resolve Wasabi keys to URLs ONCE per unique source - prevent flickering
  useEffect(() => {
    const currentRawSrc = rawSrcRef.current;
    
    if (!currentRawSrc) {
      // Keep last good image to avoid flicker/disappear during updates
      return;
    }

    // Skip if we already resolved this exact source
    if (resolvedSrc && lastDisplayedSrc && 
        (currentRawSrc === resolvedSrc || currentRawSrc === lastDisplayedSrc)) {
      return;
    }

    // Reset error retries whenever the source changes
    errorRetryRef.current = 0;
    // Default: no key known
    rawKeyRef.current = null;

    // If already a proper URL, use as-is
    if (/^(https?:|blob:|data:)/.test(currentRawSrc)) {
      if (resolvedSrc !== currentRawSrc) {
        setResolvedSrc(currentRawSrc);
        setLastDisplayedSrc(currentRawSrc);
      }
      return;
    }

    // If it looks like a storage key, remember it and resolve with retry logic
    if (/^(uploads|avatars|covers)\//i.test(currentRawSrc)) {
      rawKeyRef.current = currentRawSrc;
      
      // Check if we already have this in state (prevents re-resolution)
      if (lastDisplayedSrc && lastDisplayedSrc.includes(encodeURIComponent(currentRawSrc))) {
        return;
      }
      
      const resolveWithRetry = async (attempt = 1): Promise<void> => {
        try {
          const url = await mediaService.getUrl(currentRawSrc);
          // Preload to prevent flicker
          await mediaService.preloadImage(url).catch(() => {}); // Ignore preload failures
          setResolvedSrc(url);
          setLastDisplayedSrc(url);
        } catch (e) {
          console.warn(`Failed to resolve avatar key (attempt ${attempt}):`, currentRawSrc, e);
          if (attempt < 3) {
            // Retry with exponential backoff
            setTimeout(() => resolveWithRetry(attempt + 1), Math.pow(2, attempt) * 1000);
          } else {
            // On final failure, keep the last displayed src (don't clear it)
            console.warn('All avatar resolve attempts failed, keeping last good URL');
          }
        }
      };
      resolveWithRetry();
      return;
    }

    // Unknown format, pass through
    if (resolvedSrc !== currentRawSrc) {
      setResolvedSrc(currentRawSrc);
      setLastDisplayedSrc(currentRawSrc);
    }
  }, [rawSrcRef.current, resolvedSrc, lastDisplayedSrc]);

  const finalSrc = resolvedSrc || lastDisplayedSrc;
  
  // Fetch avatar_sizes from the database for responsive srcset
  const [avatarSizes, setAvatarSizes] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    if (!userId) return;
    const fetchSizes = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_sizes')
          .eq('id', userId)
          .maybeSingle();
        
        if (data?.avatar_sizes && typeof data.avatar_sizes === 'object') {
          setAvatarSizes(data.avatar_sizes as Record<string, string>);
          console.log('🖼️ Avatar sizes loaded for srcset:', data.avatar_sizes);
        }
      } catch (e) {
        console.warn('Failed to fetch avatar_sizes:', e);
      }
    };
    fetchSizes();
  }, [userId]);

  // Generate srcset and sizes for automatic responsive loading (browser picks best size for DPR)
  const { srcSet, sizes: sizesAttr } = React.useMemo(() => {
    if (!avatarSizes || Object.keys(avatarSizes).length === 0) {
      return { srcSet: undefined, sizes: undefined };
    }

    const sizeMap: Record<string, number> = {
      thumbnail: 80,
      small: 300,
      medium: 800,
      large: 1600,
      original: 2400
    };

    const srcSetEntries: string[] = [];

    // Build srcset with all available sizes
    for (const [sizeKey, storageKey] of Object.entries(avatarSizes)) {
      const width = sizeMap[sizeKey];
      if (width && storageKey) {
        // The key will be resolved by AvatarImage component
        srcSetEntries.push(`${storageKey} ${width}w`);
      }
    }

    if (srcSetEntries.length === 0) {
      return { srcSet: undefined, sizes: undefined };
    }

    // Define sizes attribute for browser to select optimal image
    // This tells browser: "use image closest to display size * devicePixelRatio"
    const sizesAttribute = [
      '(max-width: 80px) 80px',
      '(max-width: 300px) 300px',
      '(max-width: 800px) 800px',
      '1600px'
    ].join(', ');

    console.log('🖼️ Generated avatar srcset for crisp display:', { 
      srcSet: srcSetEntries.join(', ').substring(0, 100) + '...', 
      sizes: sizesAttribute 
    });

    return {
      srcSet: srcSetEntries.join(', '),
      sizes: sizesAttribute
    };
  }, [avatarSizes]);
  
  // STRICT: Only use first name + last name initials (NEVER email)
  // Priority 1: From profile data (firstName, lastName)
  const nameInitials = (firstName && lastName) 
    ? `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`
    : '';
  
  // Priority 2: From auth metadata (first_name, last_name)
  const authFirst = (authUser?.user_metadata?.first_name as string) || '';
  const authLast = (authUser?.user_metadata?.last_name as string) || '';
  
  const fromAuth = (authFirst && authLast)
    ? `${authFirst[0].toUpperCase()}${authLast[0].toUpperCase()}`
    : '';
  
  // Final initials: provided > derived > name-based > auth-based > default placeholder
  // NEVER use email or username for initials
  const finalInitials = (initials || derivedInitials || nameInitials || fromAuth || '??').trim();

  // Get size classes
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Handle file upload with instant local preview and progress
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadAvatar(file);
      toast.success('Profile photo updated successfully!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to update profile photo');
    } finally {
      // Reset input value to allow re-selecting the same file later
      event.target.value = '';
    }
  };

  const handleClick = () => {
    if (enableUpload && isOwnProfile) {
      fileInputRef.current?.click();
    } else if (!isOwnProfile) {
      setShowPopup(true);
    }
  };

  const content = (
    <BaseAvatar className={cn(sizeClass, className)} style={style}>
      {finalSrc && (
        <AvatarImage
          src={finalSrc}
          srcSet={srcSet}
          sizes={sizesAttr}
          alt="User avatar"
          className="object-cover"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
          loading="eager"
          onError={async () => {
            console.warn('Avatar image failed to load, attempting refresh');
            // Try to refresh if we have an underlying key and haven't retried too much
            const key = rawKeyRef.current;
            if (key && errorRetryRef.current < 2) {
              try {
                errorRetryRef.current += 1;
                mediaService.clearCache(key);
                const freshUrl = await mediaService.getUrl(key);
                await mediaService.preloadImage(freshUrl).catch(() => {});
                setResolvedSrc(freshUrl);
                setLastDisplayedSrc(freshUrl);
                return;
              } catch (e) {
                console.warn('Avatar refresh failed:', e);
              }
            }
            // Fall back to last good src (keeps fallback visible)
          }}
        />
      )}
      <AvatarFallback className={cn(
        'font-bold',
        size === 'xl' ? 'text-4xl text-gray-600' : 'font-medium'
      )}>
        <span>{finalInitials}</span>
      </AvatarFallback>
    </BaseAvatar>
  );

  if (!enableUpload && !showCameraOverlay) return content;

  // Eye icon SVG from user
  const EyeIcon = () => (
    <svg 
      fill="currentColor" 
      viewBox="0 0 425.966 425.966" 
      className="w-5 h-5 text-white"
    >
      <g>
        <path d="M425.393,205.3C425.354,205.195,425.375,205.253,425.393,205.3L425.393,205.3z"></path>
        <path d="M425.403,205.333c-1.389-3.895-3.212-7.675-5.085-11.356c-2.529-4.97-5.249-9.845-8.191-14.583 c-2.929-4.715-5.964-9.403-9.254-13.878c-13.897-18.908-29.971-36.023-48.347-50.655c-19.465-15.499-41.243-28.139-64.521-36.966 c-5.844-2.215-11.778-4.19-17.788-5.903c-5.96-1.699-11.993-3.004-18.055-4.28c-5.507-1.159-11.168-2.042-16.77-2.592 c-4.479-0.44-8.977-0.965-13.479-1.104c-7.158-0.222-14.249-0.425-21.414-0.067c-12.877,0.642-25.698,2.438-38.254,5.367 c-24.403,5.693-47.711,15.6-68.986,28.809c-21.177,13.148-40.348,29.514-56.814,48.218 c-10.606,12.048-20.058,25.041-28.099,38.932c-2.9,5.011-5.577,10.163-7.927,15.456c-1.629,3.671-3.343,7.362-1.845,11.414 c1.786,4.832,7.149,7.557,12.105,6.154c2.851-0.807,5.238-3.1,7.563-4.85c13.234-9.959,26.938-19.358,40.945-28.192 c20.817-13.13,42.582-24.942,65.493-34.007c15.428-6.104,31.404-10.931,47.712-13.968c6.822,3.821,11.44,11.106,11.44,19.481 c0,12.334-9.999,22.333-22.334,22.333c-6.481,0-12.315-2.764-16.396-7.174c-1.169,4.982-1.807,10.169-1.807,15.507 c0,37.373,30.297,67.669,67.669,67.669c37.373,0,67.669-30.296,67.669-67.669c0-18.875-7.735-35.938-20.201-48.212 c15.909,3.625,31.416,8.827,46.455,15.25c22.864,9.766,44.576,22.116,65.383,35.683c11.301,7.368,22.42,15.069,33.217,23.162 c3.367,2.522,6.614,5.641,11.146,5.343C423.158,218.228,427.584,211.478,425.403,205.333z"></path>
        <path d="M48.446,252.549c0,0,0.012,0.033,0.021,0.057C48.462,252.594,48.458,252.583,48.446,252.549z"></path>
        <path d="M368.134,242.505c-2.208,0.625-4.058,2.401-5.857,3.756c-10.251,7.716-20.866,14.994-31.715,21.838 c-16.125,10.171-32.984,19.32-50.73,26.343c-18.051,7.142-37.065,12.046-56.479,13.284c-11.719,0.749-23.572,0.198-35.167-1.647 c-16.534-2.631-32.552-7.559-47.938-14.131c-17.712-7.564-34.528-17.13-50.646-27.64c-8.752-5.707-17.365-11.673-25.728-17.939 c-2.608-1.955-5.124-4.369-8.634-4.139c-5.052,0.332-8.48,5.56-6.792,10.319c1.076,3.018,2.488,5.945,3.938,8.796 c1.96,3.85,4.066,7.625,6.345,11.296c2.269,3.652,4.62,7.283,7.168,10.75c10.766,14.646,23.215,27.901,37.449,39.235 c15.078,12.005,31.946,21.796,49.978,28.633c4.526,1.717,9.124,3.247,13.778,4.573c4.616,1.316,9.29,2.327,13.985,3.315 c4.265,0.896,8.65,1.582,12.989,2.007c3.471,0.341,6.952,0.748,10.439,0.855c5.546,0.172,11.038,0.328,16.586,0.052 c9.975-0.497,19.905-1.888,29.631-4.157c18.902-4.41,36.956-12.083,53.436-22.314c16.403-10.185,31.253-22.861,44.009-37.35 c8.215-9.332,15.537-19.396,21.765-30.156c2.247-3.882,4.32-7.872,6.14-11.972c1.263-2.844,2.591-5.703,1.431-8.841 C376.127,243.53,371.973,241.419,368.134,242.505z"></path>
        <path d="M48.466,252.606C48.475,252.63,48.473,252.626,48.466,252.606L48.466,252.606z"></path>
      </g>
    </svg>
  );

  return (
    <>
      <div className="relative group cursor-pointer" onClick={handleClick}>
        {content}

        {showCameraOverlay && !isLoading && (
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isOwnProfile ? (
              <Camera className="w-5 h-5 text-white" />
            ) : (
              <EyeIcon />
            )}
          </div>
        )}

        {isOwnProfile && enableUpload && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Select avatar image"
          />
        )}
      </div>

      {/* Popup for viewing avatar */}
      {showPopup && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowPopup(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] p-4">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={finalSrc || undefined} 
              alt="Profile" 
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
});

Avatar.displayName = 'Avatar';

export default Avatar;