import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";
import { mediaService } from "@/services/media/MediaService";

/**
 * Extract Wasabi storage key from:
 * - raw key: avatars/abc-original.jpg
 * - presigned URL with ?key=avatars/abc-original.jpg
 * - path-based URL .../avatars/abc-original.jpg
 */
function extractKey(raw?: string): string | null {
  if (!raw) return null;

  try {
    const u = new URL(raw, window.location.origin);
    const qp = u.searchParams.get("key");
    if (qp && /^(avatars|uploads|covers)\//i.test(qp)) return qp;
    const m2 = u.pathname.match(/\/(avatars|uploads|covers)\/([^?#]+)/i);
    if (m2) return `${m2[1]}/${m2[2]}`;
  } catch {}

  const m1 = raw.match(/^(avatars|uploads|covers)\/([^?#]+)/i);
  if (m1) return `${m1[1]}/${m1[2]}`;

  return null;
}

/**
 * Normalize storage key:
 * avatars/abc-original.jpg → avatars/abc
 */
function normalizeBase(key: string): string | null {
  const m = key.match(/^(avatars\/.+?)-(?:original|thumbnail|small|medium|large)\.[A-Za-z0-9]+$/i);
  return m ? m[1] : null;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
  priority?: boolean;
};

const AvatarImage = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Image>, AvatarImageProps>(
  ({ className, src, priority, onError, onLoad, ...props }, ref) => {
    const imgRef = React.useRef<HTMLImageElement | null>(null);

    const [finalSrc, setFinalSrc] = React.useState<string | undefined>(undefined);
    const [srcset, setSrcset] = React.useState<string | undefined>(undefined);
    const [sizes, setSizes] = React.useState<string>("40px");
    const [dims, setDims] = React.useState<{ w: number; h: number } | null>(null);
    const fallbackStepRef = React.useRef<number>(0);

    const key = extractKey(typeof src === "string" ? src : undefined);
    const base = key ? normalizeBase(key) : null;

    /**
     * Measure width synchronously.
     */
    React.useLayoutEffect(() => {
      const el = imgRef.current;
      if (!el || !el.parentElement) return;

      const update = () => {
        const rect = el.parentElement!.getBoundingClientRect();
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        if (w > 0 && h > 0) {
          setDims({ w, h });
          setSizes(`${w}px`);
        }
      };

      update();

      const ro = new ResizeObserver(update);
      ro.observe(el.parentElement);
      return () => ro.disconnect();
    }, []);

    /**
     * Select correct variant BEFORE rendering any image.
     * No original loads.
     */
    React.useEffect(() => {
      if (!base || !dims) return;

      const w = dims.w;
      const dpr = Math.min(4, Math.max(1, window.devicePixelRatio || 1));
      const needed = w * dpr;

      const variants = [
        { file: "thumbnail.jpg", px: 80 },
        { file: "small.jpg", px: 160 },
        { file: "medium.jpg", px: 320 },
        { file: "large.jpg", px: 640 },
      ];

      const sorted = variants.sort((a, b) => a.px - b.px);
      const chosen = sorted.find((v) => v.px >= needed) || sorted[sorted.length - 1];

      let cancelled = false;

      (async () => {
        try {
          const full = `${base}-${chosen.file}`;
          const url = await mediaService.getUrl(full);
          if (!cancelled) setFinalSrc(url);
        } catch {
          try {
            const fallbackFull = `${base}-original.jpg`;
            const fbUrl = await mediaService.getUrl(fallbackFull);
            if (!cancelled) setFinalSrc(fbUrl);
          } catch {
            if (key) {
              try {
                const kUrl = await mediaService.getUrl(key);
                if (!cancelled) setFinalSrc(kUrl);
              } catch {
                if (typeof src === "string" && !cancelled) setFinalSrc(src);
              }
            } else if (typeof src === "string" && !cancelled) {
              setFinalSrc(src);
            }
          }
        }

        const all = await Promise.all(
          variants.map(async (v) => {
            try {
              const u = await mediaService.getUrl(`${base}-${v.file}`);
              return `${u} ${v.px}w`;
            } catch {
              return null;
            }
          }),
        );

        if (!cancelled) {
          setSrcset(all.filter(Boolean).join(", ") || undefined);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [base, dims]);

    // Fallback: if no recognizable variant base, load key or original src
    React.useEffect(() => {
      if (base) return; // Variants effect will handle when base exists
      let cancelled = false;
      (async () => {
        if (typeof src === "string") {
          try {
            if (key) {
              const url = await mediaService.getUrl(key);
              if (!cancelled) setFinalSrc(url);
            } else {
              if (!cancelled) setFinalSrc(src);
            }
          } catch {}
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [base, key, src]);

    // Timeout safety: if nothing loaded within 800ms, resolve the raw key/url to avoid blank avatars
    React.useEffect(() => {
      if (finalSrc || !key) return;
      let cancelled = false;
      const t = setTimeout(async () => {
        try {
          const u = await mediaService.getUrl(key);
          if (!cancelled) setFinalSrc(u);
        } catch {
          if (typeof src === 'string' && !cancelled) setFinalSrc(src);
        }
      }, 800);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }, [finalSrc, key, src]);

    const high = priority || (dims?.w || 0) >= 64;

    return (
      <AvatarPrimitive.Image
        ref={(node) => {
          imgRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as any).current = node;
        }}
        className={cn("aspect-square h-full w-full object-cover object-center select-none", className)}
        src={finalSrc}
        srcSet={srcset}
        sizes={sizes}
        width={dims?.w}
        height={dims?.h}
        loading={high ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={high ? "high" : "low"}
        draggable={false}
        onLoad={onLoad}
        onError={async (e) => {
          try {
            // Prevent infinite loops: try at most 3 fallback steps
            if (fallbackStepRef.current > 2) return;
            const step = fallbackStepRef.current++;

            if (base && step === 0) {
              // Try original
              const orig = await mediaService.getUrl(`${base}-original.jpg`);
              setFinalSrc(orig);
              return;
            }

            if (key && step <= 1) {
              // Try resolving the raw key
              try {
                const k = await mediaService.getUrl(key);
                setFinalSrc(k);
                return;
              } catch {}
              try {
                const blob = await mediaService.getProxyBlob(key);
                setFinalSrc(blob);
                return;
              } catch {}
            }

            if (typeof src === 'string') {
              setFinalSrc(src);
              return;
            }
          } finally {
            try { onError?.(e as any); } catch {}
          }
        }}
        {...props}
      />
    );
  },
);
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
