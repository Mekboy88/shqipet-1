import { Avatar as BaseAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import { useGlobalAvatar } from '@/hooks/useGlobalAvatar';
import { toast } from 'sonner';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mediaService } from '@/services/media/MediaService';

interface AvatarProps {
  userId?: string;
  src?: string | null;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  style?: React.CSSProperties;
  enableUpload?: boolean;
  showCameraOverlay?: boolean;
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

const Avatar: React.FC<AvatarProps> = ({
  userId,
  src,
  initials,
  size = 'md',
  className,
  style,
  enableUpload = false,
  showCameraOverlay = false
}) => {
  const { firstName, lastName, initials: derivedInitials, username, email, avatarUrl: universalAvatarUrl } = useUniversalUser(userId);
  const { user: authUser } = useAuth();
  const { avatarUrl: globalAvatarUrl, isLoading, uploadAvatar } = useGlobalAvatar(userId);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  
  // Prefer provided src, then global avatar, then auth metadata URL, then universal user avatar
  const authAvatarUrl = (typeof authUser?.user_metadata?.avatar_url === 'string') 
    ? (authUser?.user_metadata?.avatar_url as string)
    : null;
  const rawSrc = src || globalAvatarUrl || authAvatarUrl || universalAvatarUrl || null;

  // Resolve Wasabi keys to URLs with retry and fallback protection
  useEffect(() => {
    if (!rawSrc) {
      // Keep last good image to avoid flicker/disappear during updates
      return;
    }

    // Reset error retries whenever the source changes
    errorRetryRef.current = 0;
    // Default: no key known
    rawKeyRef.current = null;

    // If already a proper URL, use as-is
    if (/^(https?:|blob:|data:)/.test(rawSrc)) {
      setResolvedSrc(rawSrc);
      setLastDisplayedSrc(rawSrc);
      return;
    }

    // If it looks like a storage key, remember it and resolve with retry logic
    if (/^(uploads|avatars|covers)\//i.test(rawSrc)) {
      rawKeyRef.current = rawSrc;
      const resolveWithRetry = async (attempt = 1): Promise<void> => {
        try {
          const url = await mediaService.getUrl(rawSrc);
          // Preload to prevent flicker
          await mediaService.preloadImage(url).catch(() => {}); // Ignore preload failures
          setResolvedSrc(url);
          setLastDisplayedSrc(url);
        } catch (e) {
          console.warn(`Failed to resolve avatar key (attempt ${attempt}):`, rawSrc, e);
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
    setResolvedSrc(rawSrc);
    setLastDisplayedSrc(rawSrc);
  }, [rawSrc]);

  const finalSrc = resolvedSrc || lastDisplayedSrc;
  
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
    if (enableUpload) {
      fileInputRef.current?.click();
    }
  };

  const content = (
    <BaseAvatar className={cn(sizeClass, className)} style={style}>
      {finalSrc && (
        <AvatarImage
          src={finalSrc}
          alt="User avatar"
          className="object-cover"
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

  if (!enableUpload) return content;

  return (
    <div className="relative group cursor-pointer" onClick={handleClick}>
      {content}

      {showCameraOverlay && !isLoading && (
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-4 h-4 text-white" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Select avatar image"
      />
    </div>
  );
};

export default Avatar;