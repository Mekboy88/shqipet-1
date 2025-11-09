
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
  const [computedSrcSet, setComputedSrcSet] = React.useState<string | undefined>(undefined);
  const [computedSizes, setComputedSizes] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const raw = typeof src === 'string' ? src : '';
    try { (window as any).__avatarImageGlobalLast = { raw, ts: Date.now() }; } catch {}

    if (!raw) {
      console.warn('🧪 AvatarImageGlobal: empty src', { props });
      setResolvedSrc(undefined);
      setComputedSrcSet(undefined);
      return;
    }

    // If already a direct URL/blob/data use as-is
    if (/^(https?:|blob:|data:)/i.test(raw)) {
      setResolvedSrc(raw);
      // Try to derive key from URL for srcset
      try {
        const m = raw.match(/\/(uploads|avatars|covers)\/([^?#\s]+)/i);
        const key = m ? `${m[1]}/${decodeURIComponent(m[2])}` : null;
        if (key && key.startsWith('avatars/')) {
          // Build srcset from known derivative keys
          const baseKey = key
            .replace(/-original\.[^/.]+$/i, '')
            .replace(/-(thumbnail|small|medium|large)\.[^.]+$/i, '');
          const names = ['thumbnail','small','medium','large'] as const;
          Promise.all(
            names.map(async (n) => {
              const k = `${baseKey}-${n}.jpg`;
              try { const u = await mediaService.getUrl(k); return [n, u] as const; } catch { return null; }
            })
           ).then((pairs) => {
             const map = new Map(pairs.filter(Boolean) as Array<readonly [string, string]>);
             if (map.size) {
               const widthMap: Record<string, number> = { thumbnail: 80, small: 160, medium: 320, large: 640 };
               const set = names
                 .filter((n) => map.has(n))
                 .map((n) => `${map.get(n)} ${widthMap[n]}w`)
                 .join(', ');
               setComputedSrcSet(set);
               // Prefer highest quality available for clarity
               const preferred = map.get('large') || map.get('medium') || map.get('small') || map.get('thumbnail');
               if (preferred) setResolvedSrc(preferred);
             }
           });
        }
      } catch {}
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
      
      // Build srcset for avatar keys
      try {
        if (raw.startsWith('avatars/')) {
          const baseKey = raw
            .replace(/-original\.[^/.]+$/i, '')
            .replace(/-(thumbnail|small|medium|large)\.[^.]+$/i, '');
          const names = ['thumbnail','small','medium','large'] as const;
          Promise.all(
            names.map(async (n) => {
              const k = `${baseKey}-${n}.jpg`;
              try { const u = await mediaService.getUrl(k); return [n, u] as const; } catch { return null; }
            })
           ).then((pairs) => {
             const map = new Map(pairs.filter(Boolean) as Array<readonly [string, string]>);
             if (map.size) {
               const widthMap: Record<string, number> = { thumbnail: 80, small: 160, medium: 320, large: 640 };
               const set = names
                 .filter((n) => map.has(n))
                 .map((n) => `${map.get(n)} ${widthMap[n]}w`)
                 .join(', ');
               setComputedSrcSet(set);
               // Prefer highest quality available for clarity
               const preferred = map.get('large') || map.get('medium') || map.get('small') || map.get('thumbnail');
               if (preferred) setResolvedSrc(preferred);
             }
           });
        }
      } catch {}
      
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
      className={cn("aspect-square h-full w-full object-contain object-center select-none", className)}
      src={resolvedSrc}
      srcSet={(props as any).srcSet ?? computedSrcSet}
      sizes={(props as any).sizes ?? computedSizes}
      width={dimensions?.width}
      height={dimensions?.height}
      loading="eager"
      decoding="sync"
      // @ts-ignore - not in TS types but supported by browsers
      fetchpriority="high"
      draggable={false}
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
