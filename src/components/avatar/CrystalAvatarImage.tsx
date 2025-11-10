import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";
import { mediaService } from "@/services/media/MediaService";

export type CrystalAvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
  priority?: boolean;
};

export const CrystalAvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  CrystalAvatarImageProps
>(({ className, src, onError, onLoad, priority, sizes = '160px', style, ...props }, ref) => {
  const [resolvedSrc, setResolvedSrc] = React.useState<string | undefined>(src as any);
  const retriedOnceRef = React.useRef(false);
  const lockedRef = React.useRef<boolean>(false);

  // Parse explicit pixel size from sizes prop
  const explicitPx = React.useMemo(() => {
    if (!sizes) return 160; // default to 160px
    const m = String(sizes).match(/(\d+(?:\.\d+)?)px/);
    return m ? Math.round(parseFloat(m[1])) : 160;
  }, [sizes]);

  React.useEffect(() => {
    if (lockedRef.current) return;

    const raw = typeof src === 'string' ? src : '';
    if (!raw) {
      setResolvedSrc(undefined);
      return;
    }

    // Direct URLs: use as-is and lock
    if (/^(https?:|blob:|data:)/i.test(raw)) {
      setResolvedSrc(raw);
      lockedRef.current = true;
      return;
    }

    // Storage keys: resolve with single best variant
    if (/^(uploads|avatars|covers)\//i.test(raw)) {
      const dpr = Math.min(4, Math.max(1, window.devicePixelRatio || 1));
      const targetPx = Math.ceil(explicitPx * dpr);

      (async () => {
        try {
          let finalUrl: string;

          if (/^avatars\//i.test(raw)) {
            const baseMatch = raw.match(/^(avatars\/.+?)-(?:original|thumbnail|small|medium|large)\.[A-Za-z0-9]+$/i);
            const base = baseMatch ? baseMatch[1] : null;

            if (base) {
              let variantName: 'large' | 'medium';
              if (targetPx >= 320) variantName = 'large'; else variantName = 'medium';

              const extMatch = raw.match(/\.([A-Za-z0-9]+)(?:[?#]|$)/);
              const ext = (extMatch ? extMatch[1] : 'jpg').toLowerCase();

              try {
                finalUrl = await mediaService.getUrl(`${base}-${variantName}.${ext}`);
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
            lockedRef.current = true;
          }
        } catch (err) {
          console.error('CrystalAvatar resolve failed:', err);
        }
      })();
      return;
    }

    setResolvedSrc(raw);
    lockedRef.current = true;
  }, [src, explicitPx]);

  const isHighPriority = priority || explicitPx >= 64;

  // Debug: enable via ?avatarDebug=1 or localStorage.setItem('avatarDebug','1')
  const debugEnabled = React.useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('avatarDebug');
      const s = localStorage.getItem('avatarDebug');
      return q === '1' || q === 'true' || s === '1' || s === 'true';
    } catch { return false; }
  }, []);

  return (
    <AvatarPrimitive.Image
      ref={ref as any}
      className={cn("aspect-square h-full w-full object-cover object-center select-none img-locked", className)}
      src={resolvedSrc}
      width={explicitPx}
      height={explicitPx}
      loading={isHighPriority ? "eager" : "lazy"}
      decoding="async"
      // @ts-ignore
      fetchpriority={isHighPriority ? "high" : "auto"}
      draggable={false}
      data-locked={process.env.NODE_ENV === 'development' ? String(lockedRef.current) : undefined}
      onLoad={(e) => {
        if (debugEnabled) {
          const el = e.currentTarget as HTMLImageElement;
          console.log('[CrystalAvatar] loaded', {
            currentSrc: el.currentSrc,
            naturalWidth: el.naturalWidth,
            naturalHeight: el.naturalHeight,
            widthAttr: el.getAttribute('width'),
            heightAttr: el.getAttribute('height')
          });
        }
        onLoad?.(e);
      }}
      onError={(e) => {
        const s = (e.currentTarget as HTMLImageElement).currentSrc;
        if (!retriedOnceRef.current && typeof s === 'string') {
          retriedOnceRef.current = true;
          try {
            let key: string | null = null;
            try {
              const url = new URL(s, window.location.origin);
              const qpKey = url.searchParams.get('key');
              if (qpKey && /^(uploads|avatars|covers)\//i.test(qpKey)) {
                key = decodeURIComponent(qpKey);
              }
            } catch {}
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
});
CrystalAvatarImage.displayName = 'CrystalAvatarImage';
