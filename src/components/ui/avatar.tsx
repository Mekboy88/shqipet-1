
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

type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & { priority?: boolean };

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, src, onError, onLoad, priority, sizes, ...props }, ref) => {
  const [resolvedSrc, setResolvedSrc] = React.useState<string | undefined>(src as any);
  const retriedOnceRef = React.useRef(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const lockedWidthRef = React.useRef<number>(0);
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [computedSizes, setComputedSizes] = React.useState<string | undefined>(undefined);
  const [computedSrcSet, setComputedSrcSet] = React.useState<string | undefined>(undefined);
  const explicitPx = React.useMemo(() => {
    if (!sizes) return null;
    const m = String(sizes).match(/(\d+(?:\.\d+)?)px/);
    return m ? Math.round(parseFloat(m[1])) : null;
  }, [sizes]);

  React.useEffect(() => {
    const raw = typeof src === 'string' ? src : '';
    
    if (!raw) {
      setResolvedSrc(undefined);
      return;
    }

    // If URL contains a storage key (?key=avatars/... etc), defer resolution
    try {
      const u = new URL(raw, window.location.origin);
      const qp = u.searchParams.get('key');
      if (qp && /^(uploads|avatars|covers)\//i.test(qp)) {
        setResolvedSrc(undefined);
        return;
      }
    } catch {}

    // If already a direct URL/blob/data without a storage key, use as-is
    if (/^(https?:|blob:|data:)/i.test(raw)) {
      setResolvedSrc(raw);
      return;
    }

    // If looks like a storage key, defer resolution until after we know dimensions
    if (/^(uploads|avatars|covers)\//i.test(raw)) {
      setResolvedSrc(undefined);
      return;
    }

    // Unknown format, pass through
    setResolvedSrc(raw);
  }, [src]);


  // Original-quality lock: treat original/PNG/unknown as >=640w to prevent downshift
  React.useEffect(() => {
    const s = resolvedSrc || '';
    if (!s) return;
    const isOriginalOrPngOrUnknown =
      /-(original)\./i.test(s) ||
      /\.png(\?|$)/i.test(s) ||
      !/-(thumbnail|small|medium|large)\./i.test(s);
    if (isOriginalOrPngOrUnknown && lockedWidthRef.current < 640) {
      lockedWidthRef.current = 640;
    }
  }, [resolvedSrc]);

  // Build responsive srcset from variant keys when available
  React.useEffect(() => {
    const raw = typeof src === 'string' ? src : '';
    if (!raw) {
      setComputedSrcSet(undefined);
      return;
    }

    let key: string | null = null;
    try {
      const u = new URL(raw, window.location.origin);
      const qp = u.searchParams.get('key');
      if (qp) key = decodeURIComponent(qp);
    } catch {}

    if (!key) {
      const m = raw.match(/^(uploads|avatars|covers)\/([^?#\s]+)/i);
      if (m && m[1] && m[2]) key = `${m[1]}/${m[2]}`;
    }

    const isDirect = /^(https?:|blob:|data:)/i.test(raw);
    if (isDirect && !key) {
      setComputedSrcSet(undefined);
      return;
    }

    if (!key && !isDirect && resolvedSrc) {
      try {
        const u2 = new URL(resolvedSrc);
        const qp2 = u2.searchParams.get('key');
        if (qp2) key = decodeURIComponent(qp2);
      } catch {}
      if (!key) {
        const m2 = resolvedSrc.match(/\/(uploads|covers|avatars)\/([^?#\s]+)/i);
        if (m2 && m2[1] && m2[2]) key = `${m2[1]}/${decodeURIComponent(m2[2])}`;
      }
    }

    if (!key) {
      setComputedSrcSet(undefined);
      return;
    }

    // If key is not an avatars/ key, resolve it directly and avoid variants
    if (!/^avatars\//i.test(key)) {
      let canceled = false;
      (async () => {
        try {
          const url = await mediaService.getUrl(key!);
          if (!canceled) setResolvedSrc(url);
        } catch {}
      })();
      setComputedSrcSet(undefined);
      return () => { canceled = true; };
    }

    // Early path for small avatars: pick a high-quality single src and skip srcSet
    const parsePxEarly = (s?: string): number | null => {
      if (!s) return null;
      const m = String(s).match(/(\d+(?:\.\d+)?)px/);
      return m ? Math.round(parseFloat(m[1])) : null;
    };
    const sizedPxEarly = parsePxEarly(sizes as any);
    const baseWidthEarly = (sizedPxEarly ?? dimensions?.width ?? 0) || 40;
    if (baseWidthEarly <= 48) {
      let canceledSmall = false;
      (async () => {
        try {
          // Try to derive avatars base for quality variant
          const baseMatchEarly = key!.match(/^(avatars\/.+?)-(?:original|thumbnail|small|medium|large)\.[A-Za-z0-9]+$/i);
          const baseEarly = baseMatchEarly ? baseMatchEarly[1] : null;
          const dpr = Math.min(4, Math.max(1, window.devicePixelRatio || 1));
          const target = Math.max(Math.ceil(baseWidthEarly * dpr), 320);
          const pickSuffix = target >= 640 ? 'large.jpg' : 'medium.jpg';
          let url: string | null = null;
          if (baseEarly) {
            try {
              url = await mediaService.getUrl(`${baseEarly}-${pickSuffix}`);
            } catch {}
          }
          if (!url) {
            url = await mediaService.getUrl(key!);
          }
          if (!canceledSmall && url) setResolvedSrc(url);
        } catch {}
      })();
      setComputedSrcSet(undefined);
      return () => { canceledSmall = true; };
    }

    const baseMatch = key.match(/^(avatars\/.+?)-(?:original|thumbnail|small|medium|large)\.[A-Za-z0-9]+$/i);
    const base = baseMatch ? baseMatch[1] : null;
    if (!base) {
      // Fallback: resolve the key directly without variants
      let canceled2 = false;
      (async () => {
        try {
          const url = await mediaService.getUrl(key!);
          if (!canceled2) setResolvedSrc(url);
        } catch {}
      })();
      setComputedSrcSet(undefined);
      return () => { canceled2 = true; };
    }

    // Clear cache before resolving to avoid stale URLs
    mediaService.clearCache(base);

    const variantMeta = [
      { suffix: 'thumbnail.jpg', w: 80 },
      { suffix: 'small.jpg', w: 160 },
      { suffix: 'medium.jpg', w: 320 },
      { suffix: 'large.jpg', w: 640 },
    ];

    let canceled = false;
    (async () => {
      const available: Array<{ suffix: string; w: number; url: string }> = [];
      for (const v of variantMeta) {
        try {
          const url = await mediaService.getUrl(`${base}-${v.suffix}`);
          if (url) available.push({ ...v, url });
        } catch (err) {
          console.warn(`Variant ${v.suffix} not available for ${base}`);
        }
      }

      if (canceled) return;

      // Fallback if no variants available: resolve the provided key directly
      if (available.length === 0) {
        try {
          const direct = await mediaService.getUrl(key!);
          if (!canceled && direct) setResolvedSrc(direct);
        } catch {}
        setComputedSrcSet(undefined);
        return;
      }

      const dpr = Math.min(4, Math.max(1, window.devicePixelRatio || 1));
      const parsePx = (s?: string): number | null => {
        if (!s) return null;
        const m = s.match(/(\d+(?:\.\d+)?)px/);
        return m ? Math.round(parseFloat(m[1])) : null;
      };

      const sizedPx = parsePx(sizes as any);
      const baseWidth = (sizedPx ?? dimensions?.width ?? 0) || 40; // fallback to 40px
      const neededPixels = Math.ceil(baseWidth * dpr);
      const isSmallAvatar = baseWidth <= 48; // xs/sm/md buckets
      const minFloor = isSmallAvatar ? 320 : 640;
      const target = Math.max(neededPixels, minFloor);

      const sorted = available.sort((a, b) => a.w - b.w);
      let chosen = sorted.find(v => v.w >= target) || sorted[sorted.length - 1];

      if (!canceled && chosen?.url) {
        setResolvedSrc(prev => {
          if (lockedWidthRef.current && chosen.w < lockedWidthRef.current) return prev;
          lockedWidthRef.current = Math.max(lockedWidthRef.current, chosen.w);
          return chosen.url;
        });
      }

      // Disable srcset globally to prevent any browser-initiated swaps on hover/layout
      setComputedSrcSet(undefined);
    })();

    return () => { canceled = true; };
  }, [src, dimensions, sizes]);

  // Measure container size and set integer dimensions for crisp rendering
  React.useLayoutEffect(() => {
    if (sizes) return; // Skip observing when explicit sizes are provided

    const el = imgRef.current;
    if (!el) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const rounded = {
          width: Math.round(width),
          height: Math.round(height)
        };
        setDimensions(rounded);

        // Update sizes hint based on actual rendered size (only if not provided by parent)
        if (rounded.width > 0 && !sizes) {
          setComputedSizes(`${rounded.width}px`);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [sizes]);

  const isHighPriority = priority || (dimensions?.width || 0) >= 64;

  return (
    <AvatarPrimitive.Image
      ref={(node) => {
        imgRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn("aspect-square h-full w-full object-cover object-center select-none", className)}
      src={resolvedSrc}
      srcSet={computedSrcSet}
      sizes={sizes ?? computedSizes ?? "40px"}
      width={explicitPx ?? dimensions?.width ?? undefined}
      height={explicitPx ?? dimensions?.height ?? undefined}
      loading={isHighPriority ? "eager" : "lazy"}
      decoding="async"
      // @ts-ignore - not in TS types but supported by browsers
      fetchpriority={isHighPriority ? "high" : "auto"}
      draggable={false}
      data-quality-locked={process.env.NODE_ENV === 'development' ? (lockedWidthRef.current ? 'true' : 'false') : undefined}
      data-variant-selected={process.env.NODE_ENV === 'development' && resolvedSrc ? 
        (resolvedSrc.includes('large') ? '640' : 
         resolvedSrc.includes('medium') ? '320' : 
         resolvedSrc.includes('small') ? '160' : 
         resolvedSrc.includes('thumbnail') ? '80' : 'unknown') : undefined}
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
