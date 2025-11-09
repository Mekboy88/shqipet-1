
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"
import { mediaService } from "@/services/media/MediaService"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, onError, onLoad, ...props }, ref) => {
  const [resolvedSrc, setResolvedSrc] = React.useState<string | undefined>(src as any);
  const retriedOnceRef = React.useRef(false);

  React.useEffect(() => {
    const raw = typeof src === 'string' ? src : '';
    try { (window as any).__avatarImageGlobalLast = { raw, ts: Date.now() }; } catch {}

    if (!raw) {
      console.warn('🧪 AvatarImageGlobal: empty src', { props });
      setResolvedSrc(undefined);
      return;
    }

    // If already a direct URL/blob/data use as-is
    if (/^(https?:|blob:|data:)/i.test(raw)) {
      setResolvedSrc(raw);
      return;
    }

    // If looks like a Wasabi key (uploads|avatars|covers), resolve it via mediaService with retry
    if (/^(uploads|avatars|covers)\//i.test(raw)) {
      let canceled = false;
      console.log('🧪 AvatarImageGlobal: resolving key', raw.slice(0, 140));
      
      const resolveWithRetry = async (attempt = 1): Promise<void> => {
        try {
          const url = await mediaService.getUrl(raw);
          if (!canceled) setResolvedSrc(url);
        } catch (e) {
          console.warn(`⚠️ AvatarImageGlobal: resolve failed (attempt ${attempt}):`, e);
          if (attempt < 3 && !canceled) {
            // Retry with exponential backoff
            setTimeout(() => resolveWithRetry(attempt + 1), Math.pow(2, attempt) * 1000);
          }
          // On final failure, keep the previous resolvedSrc (don't clear it)
        }
      };
      
      resolveWithRetry();
      return () => { canceled = true; };
    }

    // Unknown format, pass through
    setResolvedSrc(raw);
  }, [src]);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      style={{ imageRendering: '-webkit-optimize-contrast' }}
      src={resolvedSrc}
      onLoad={(e) => {
        const s = (e.currentTarget as HTMLImageElement).currentSrc;
        console.log('🧪 AvatarImageGlobal onLoad', { src: s.slice(0, 140) });
        onLoad?.(e);
      }}
      onError={(e) => {
        const s = (e.currentTarget as HTMLImageElement).currentSrc;
        console.warn('🧪 AvatarImageGlobal onError', { src: s, origSrc: src });
        // Attempt one-time recovery by deriving key and refreshing a fresh URL
        if (!retriedOnceRef.current && typeof s === 'string' && /wasabi|s3/i.test(s)) {
          retriedOnceRef.current = true;
          try {
            let key: string | null = null;
            const m1 = s.match(/\/(uploads|covers|avatars)\/([^?#\s]+)/i);
            if (m1 && m1[1] && m1[2]) {
              key = `${m1[1]}/${decodeURIComponent(m1[2])}`;
            } else {
              const m2 = s.match(/\/shqipet\/([^?#\s]+)/i);
              if (m2 && m2[1]) key = decodeURIComponent(m2[1]);
            }
            if (key) {
              try { mediaService.clearCache(key); } catch {}
              mediaService.getUrl(key)
                .then((fresh) => { if (fresh) setResolvedSrc(fresh); })
                .catch((err) => console.warn('⚠️ AvatarImageGlobal: refresh failed', err));
            }
          } catch (err) {
            console.warn('⚠️ AvatarImageGlobal: derive key failed', err);
          }
        }
        onError?.(e);
      }}
      {...props}
    />
  );
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
