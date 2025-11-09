
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
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [computedSizes, setComputedSizes] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const raw = typeof src === 'string' ? src : '';
    
    if (!raw) {
      setResolvedSrc(undefined);
      return;
    }

    // If already a direct URL/blob/data use as-is
    if (/^(https?:|blob:|data:)/i.test(raw)) {
      setResolvedSrc(raw);
      return;
    }

    // If looks like a Wasabi key (uploads|avatars|covers), resolve it via mediaService
    if (/^(uploads|avatars|covers)\//i.test(raw)) {
      let canceled = false;
      
      const resolveWithRetry = async (attempt = 1): Promise<void> => {
        try {
          const url = await mediaService.getUrl(raw);
          if (!canceled) setResolvedSrc(url);
        } catch (e) {
          console.warn(`⚠️ AvatarImage: resolve failed (attempt ${attempt}):`, e);
          if (attempt < 3 && !canceled) {
            setTimeout(() => resolveWithRetry(attempt + 1), Math.pow(2, attempt) * 1000);
          }
        }
      };
      
      resolveWithRetry();
      return () => { canceled = true; };
    }

    // Unknown format, pass through
    setResolvedSrc(raw);
  }, [src]);

  // Measure container size and set integer dimensions for crisp rendering
  React.useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img || !img.parentElement) return;

    const updateDimensions = () => {
      const parent = img.parentElement;
      const rect = parent.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w > 0 && h > 0) {
        setDimensions({ width: w, height: h });
        setComputedSizes(`${w}px`);
      }
    };

    updateDimensions();
    
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(img.parentElement);
    
    return () => observer.disconnect();
  }, []);

  return (
    <AvatarPrimitive.Image
      ref={(node) => {
        imgRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn("aspect-square h-full w-full object-cover object-center select-none", className)}
      src={resolvedSrc}
      sizes={computedSizes ?? "40px"}
      width={dimensions?.width}
      height={dimensions?.height}
      loading="eager"
      decoding="sync"
      // @ts-ignore - not in TS types but supported by browsers
      fetchpriority="high"
      draggable={false}
      onLoad={onLoad}
      onError={(e) => {
        const s = (e.currentTarget as HTMLImageElement).currentSrc;
        // Attempt one-time recovery
        if (!retriedOnceRef.current && typeof s === 'string') {
          retriedOnceRef.current = true;
          try {
            let key: string | null = null;
            // Try query parameter first
            try {
              const url = new URL(s, window.location.origin);
              const qpKey = url.searchParams.get('key');
              if (qpKey && /^(uploads|avatars|covers)\//i.test(qpKey)) {
                key = decodeURIComponent(qpKey);
              }
            } catch {}
            // Try path extraction
            if (!key) {
              const m1 = s.match(/\/(uploads|covers|avatars)\/([^?#\s]+)/i);
              if (m1 && m1[1] && m1[2]) {
                key = `${m1[1]}/${decodeURIComponent(m1[2])}`;
              }
            }
            if (key) {
              mediaService.clearCache(key);
              mediaService.getUrl(key).then(setResolvedSrc).catch(() => {});
            }
          } catch {}
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
