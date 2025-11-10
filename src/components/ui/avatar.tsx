
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"
import { mediaService } from "@/services/media/MediaService"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, style, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full img-locked-wrapper",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & { priority?: boolean };

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, src, onError, onLoad, priority, sizes = '160px', style, ...props }, ref) => {
  const [resolvedSrc, setResolvedSrc] = React.useState<string | undefined>(src as any);
  const retriedOnceRef = React.useRef(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const lockedRef = React.useRef<boolean>(false);
  
  // Parse explicit pixel size from sizes prop
  const explicitPx = React.useMemo(() => {
    if (!sizes) return null;
    const m = String(sizes).match(/(\d+(?:\.\d+)?)px/);
    return m ? Math.round(parseFloat(m[1])) : null;
  }, [sizes]);

  // Resolve src only once: direct URLs stay, keys get resolved to single high-quality variant
  React.useEffect(() => {
    if (lockedRef.current) return; // Never change after first resolve
    
    const raw = typeof src === 'string' ? src : '';
    
    if (!raw) {
      setResolvedSrc(undefined);
      return;
    }

    // Direct URLs: use as-is and lock immediately
    if (/^(https?:|blob:|data:)/i.test(raw)) {
      setResolvedSrc(raw);
      lockedRef.current = true;
      return;
    }

    // Storage keys: resolve to single best variant for this size × DPR
    if (/^(uploads|avatars|covers)\//i.test(raw)) {
      const dpr = Math.min(4, Math.max(1, window.devicePixelRatio || 1));
      const baseWidth = explicitPx || 40;
      const targetPx = Math.ceil(baseWidth * dpr);
      
      (async () => {
        try {
          let finalUrl: string;
          
          // For avatars, pick the single best variant and lock it
          if (/^avatars\//i.test(raw)) {
            const baseMatch = raw.match(/^(avatars\/.+?)-(?:original|thumbnail|small|medium|large)\.[A-Za-z0-9]+$/i);
            const base = baseMatch ? baseMatch[1] : null;
            
            if (base) {
              // Choose variant: >=640w if target >=320, else >=320w if target >=160, else medium as floor
              let variantName: string;
              if (targetPx >= 320) variantName = 'large'; // 640w
              else if (targetPx >= 160) variantName = 'medium'; // 320w
              else variantName = 'medium'; // 320w floor for sharpness
              
              // Preserve original extension (e.g., PNG stays PNG). Fallback to jpg if unknown
              const extMatch = raw.match(/\.([A-Za-z0-9]+)(?:[?#]|$)/);
              const ext = (extMatch ? extMatch[1] : 'jpg').toLowerCase();
              
              try {
                finalUrl = await mediaService.getUrl(`${base}-${variantName}.${ext}`);
              } catch {
                // Fallback to original key
                finalUrl = await mediaService.getUrl(raw);
              }
            } else {
              // Not a variant key, resolve directly
              finalUrl = await mediaService.getUrl(raw);
            }
          } else {
            // Non-avatar key: resolve directly
            finalUrl = await mediaService.getUrl(raw);
          }
          
          if (!lockedRef.current) {
            setResolvedSrc(finalUrl);
            lockedRef.current = true;
          }
        } catch (err) {
          console.error('Avatar resolve failed:', err);
        }
      })();
      return;
    }

    // Unknown format: use as-is and lock
    setResolvedSrc(raw);
    lockedRef.current = true;
  }, [src, explicitPx]);




  const isHighPriority = priority || (explicitPx && explicitPx >= 64);

  return (
    <AvatarPrimitive.Image
      ref={(node) => {
        imgRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn("aspect-square h-full w-full object-cover object-center select-none img-locked", className)}
      src={resolvedSrc}
      width={explicitPx || undefined}
      height={explicitPx || undefined}
      loading={isHighPriority ? "eager" : "lazy"}
      decoding="async"
      // @ts-ignore
      fetchpriority={isHighPriority ? "high" : "auto"}
      draggable={false}
      data-locked={process.env.NODE_ENV === 'development' ? String(lockedRef.current) : undefined}
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
