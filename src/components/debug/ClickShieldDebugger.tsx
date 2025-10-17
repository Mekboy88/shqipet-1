import React, { useEffect } from "react";

// Temporary debugging tool to detect elements that may block clicks (overlays)
const ClickShieldDebugger: React.FC = () => {
  useEffect(() => {
    const prefix = "🛡️ ClickShield";

    const scan = () => {
      const selectors = [
        '[data-overlay]',
        '[role="dialog"]',
        '[role="alertdialog"]',
        '.fixed.inset-0',
        '[class*="fixed"][class*="inset-0"]',
      ];
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>(selectors.join(","))
      );

      nodes.forEach((el) => {
        try {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const zStr = style.zIndex || "0";
          const z = parseInt(zStr, 10) || 0;
          const area = rect.width * rect.height;
          const screenArea = window.innerWidth * window.innerHeight;
          const coversScreen = area >= screenArea * 0.5; // likely a screen-covering layer
          const blocksClicks =
            style.pointerEvents !== "none" &&
            style.visibility !== "hidden" &&
            style.display !== "none";

          // Log info to help identify blockers
          // Intentionally not mutating pointer-events by default to avoid breaking other modals
          if (coversScreen && blocksClicks && z >= 10000) {
            // el.style.outline = "2px dashed rgba(255,0,0,0.6)";
            // const prev = el.style.pointerEvents;
            // el.style.pointerEvents = "none";
            // Remember to restore in cleanup if you enable the mutation above
            console.info(prefix + ": candidate overlay", {
              el,
              rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
              zIndex: zStr,
              pointerEvents: style.pointerEvents,
              visibility: style.visibility,
              display: style.display,
            });
          }
        } catch (e) {
          console.warn(prefix + ": error inspecting element", e);
        }
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      const topEl = document.elementFromPoint(e.clientX, e.clientY);
      console.info(
        `${prefix}: pointer at (${e.clientX}, ${e.clientY}) ->`,
        topEl
      );
    };

    scan();
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
};

export default ClickShieldDebugger;
