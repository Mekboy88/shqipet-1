import React from 'react';

const ClickTrapDebugger: React.FC = () => {
  React.useEffect(() => {
    const handler = (e: MouseEvent | PointerEvent) => {
      const x = (e as PointerEvent).clientX ?? 0;
      const y = (e as PointerEvent).clientY ?? 0;
      const stack = document.elementsFromPoint(x, y);
      // Log useful info
      // eslint-disable-next-line no-console
      console.log('[ClickTrapDebugger] target:', e.target);
      // eslint-disable-next-line no-console
      console.log('[ClickTrapDebugger] stack top 6:', stack.slice(0, 6).map(el => ({
        tag: el.tagName,
        classes: (el as HTMLElement).className,
        id: (el as HTMLElement).id,
        z: getComputedStyle(el as Element).zIndex,
        pe: getComputedStyle(el as Element).pointerEvents,
        pos: getComputedStyle(el as Element).position,
        dataState: (el as HTMLElement).getAttribute('data-state'),
      })));

      const top = stack[0] as HTMLElement | undefined;
      if (top) {
        const prev = top.style.outline;
        top.style.outline = '3px solid rgba(255,0,0,0.7)';
        setTimeout(() => {
          top.style.outline = prev;
        }, 600);
      }
    };

    window.addEventListener('pointerdown', handler as any, { capture: true });
    return () => window.removeEventListener('pointerdown', handler as any, true);
  }, []);

  return null;
};

export default ClickTrapDebugger;
