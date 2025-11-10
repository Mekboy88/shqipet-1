
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"
import { mediaService } from "@/services/media/MediaService"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, style, ...props }, ref) => {
  const innerRef = React.useRef<HTMLSpanElement | null>(null);
  const mergedRef = (node: any) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as any).current = node;
  };
  const [roundedSize, setRoundedSize] = React.useState<{ w?: number; h?: number }>({});
  React.useLayoutEffect(() => {
    const el = innerRef.current as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = r.width, h = r.height;
    if (w > 0 && h > 0) {
      const rw = Math.round(w);
      const rh = Math.round(h);
      if (Math.abs(rw - w) > 0.01 || Math.abs(rh - h) > 0.01) {
        setRoundedSize({ w: rw, h: rh });
      }
    }
  }, [className, style]);
  return (
    <AvatarPrimitive.Root
      ref={mergedRef}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full img-locked-wrapper",
        className
      )}
      style={roundedSize.w && roundedSize.h ? { ...style, width: roundedSize.w, height: roundedSize.h } : style}
      {...props}
    />
  );
})
Avatar.displayName = AvatarPrimitive.Root.displayName

type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & { priority?: boolean };

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, src, onError, onLoad, priority, sizes, style, ...props }, ref) => {
  const initialSrc = React.useMemo(() => {
    const s = typeof src === 'string' ? src : '';
    return /^(https?:|blob:|data:)/i.test(s) ? (s as any) : undefined;
  }, [src]);
  const [resolvedSrc, setResolvedSrc] = React.useState<string | undefined>(initialSrc);
  const [resolvedSrcSet, setResolvedSrcSet] = React.useState<string | undefined>(undefined);
  const retriedOnceRef = React.useRef(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const lockedRef = React.useRef<boolean>(false);
  
  // Parse explicit pixel size from sizes prop
  const explicitPx = React.useMemo(() => {
    if (!sizes) return null;
    const m = String(sizes).match(/(\d+(?:\.\d+)?)px/);
    return m ? Math.round(parseFloat(m[1])) : null;
  }, [sizes]);

  // Measure the container width to derive integer pixel size when sizes is not provided
  const [measuredPx, setMeasuredPx] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    if (explicitPx) return; // respect explicit sizes
    const node = imgRef.current?.parentElement as HTMLElement | null;
    if (!node) return;
    const r = node.getBoundingClientRect();
    if (r && r.width) {
      setMeasuredPx(Math.round(r.width));
    }
  }, [explicitPx]);

  // Use explicit sizes if provided, else measured px
  const computedSizes = React.useMemo(() => {
    return sizes || (measuredPx ? `${measuredPx}px` : undefined);
  }, [sizes, measuredPx]);

  // Resolve src synchronously for direct URLs, async for storage keys
  React.useEffect(() => {
    if (lockedRef.current) return;
    
    const raw = typeof src === 'string' ? src : '';
    
    if (!raw) {
      setResolvedSrc(undefined);
      setResolvedSrcSet(undefined);
      return;
    }

    // Direct URLs: use as-is and lock immediately
    if (/^(https?:|blob:|data:)/i.test(raw)) {
      setResolvedSrc(raw);
      lockedRef.current = true;
      return;
    }

    // Storage keys: resolve with srcSet
    if (/^(uploads|avatars|covers)\//i.test(raw)) {
      const dpr = Math.min(4, Math.max(1, window.devicePixelRatio || 1));
      const baseWidth = explicitPx || 40;
      const targetPx = Math.ceil(baseWidth * dpr);
      
      (async () => {
        try {
          let finalUrl: string;
          let srcSetStr = '';
          
          if (/^avatars\//i.test(raw)) {
            const baseMatch = raw.match(/^(avatars\/.+?)-(?:original|thumbnail|small|medium|large)\.[A-Za-z0-9]+$/i);
            const base = baseMatch ? baseMatch[1] : null;
            
            if (base) {
              // Build full srcSet: 80w, 160w, 320w, 640w
              const variants = [
                { key: `${base}-thumbnail.jpg`, width: 80 },
                { key: `${base}-small.jpg`, width: 160 },
                { key: `${base}-medium.jpg`, width: 320 },
                { key: `${base}-large.jpg`, width: 640 }
              ];
              
              const resolved = await Promise.allSettled(
                variants.map(v => mediaService.getUrl(v.key).then(url => ({ url, width: v.width })))
              );
              
              const srcSetParts: string[] = [];
              resolved.forEach((result) => {
                if (result.status === 'fulfilled' && result.value.url) {
                  srcSetParts.push(`${result.value.url} ${result.value.width}w`);
                }
              });
              
              if (srcSetParts.length > 0) {
                srcSetStr = srcSetParts.join(', ');
              }
              
              // Pick default src based on target
              let suffix: string;
              if (targetPx >= 320) suffix = 'large.jpg';
              else if (targetPx >= 160) suffix = 'medium.jpg';
              else suffix = 'medium.jpg';
              
              try {
                finalUrl = await mediaService.getUrl(`${base}-${suffix}`);
              } catch {
                finalUrl = await mediaService.getUrl(raw);
              }
            } else {
              finalUrl = await mediaService.getUrl(raw);
            }
          } else {
            finalUrl = await mediaService.getUrl(raw);
          }
          
          if (!lockedRef.current) {
            setResolvedSrc(finalUrl);
            if (srcSetStr) setResolvedSrcSet(srcSetStr);
            lockedRef.current = true;
          }
        } catch (err) {
          console.error('Avatar resolve failed:', err);
        }
      })();
      return;
    }

    // Unknown format: use as-is
    setResolvedSrc(raw);
    lockedRef.current = true;
  }, [src, explicitPx]);




  const isHighPriority = priority || (explicitPx && explicitPx >= 64);

  // Avoid initial empty image render for storage keys to prevent blur from double-rasterization
  if (!resolvedSrc) {
    return null;
  }

  return (
    <AvatarPrimitive.Image
      ref={(node) => {
        imgRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn("aspect-square h-full w-full object-cover object-center select-none img-locked", className)}
      src={resolvedSrc}
      srcSet={resolvedSrcSet}
      sizes={computedSizes}
      width={explicitPx || measuredPx || undefined}
      height={explicitPx || measuredPx || undefined}
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
