
import { ElasticState } from './types';
import { findScrollableParent, getNearestScrollContainer, getTransformTarget } from './domUtils';
import { updateIndicator, hideIndicator } from './indicator';

export const createWheelHandler = (state: ElasticState) => {
  let resetTimeout: ReturnType<typeof setTimeout> | null = null;
  
  const handleWheel = (e: WheelEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Skip if elastic is disabled on this element
    if (target.closest('[data-elastic-disabled="true"]')) return;

    // Ignore horizontal scrollers and horizontal-dominant wheels
    if (target.closest('[data-horizontal-scroll="true"]')) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

    // Prefer data-scroll-container, fallback to nearest scrollable
    const scrollEl = (getNearestScrollContainer(target) as HTMLElement) || document.documentElement;
    if (!scrollEl) return;

    // Ensure the element is actually vertically scrollable; otherwise, let native scroll proceed
    const scrollable = (scrollEl.scrollHeight - scrollEl.clientHeight) > 2;
    if (!scrollable) return;

    // Direction and boundaries
    const deltaY = -e.deltaY;
    const atTop = scrollEl.scrollTop <= 0;
    const atBottom = Math.ceil(scrollEl.scrollTop + scrollEl.clientHeight) >= scrollEl.scrollHeight;

    // Engage elastic when attempting to scroll past boundaries (no fast threshold)
    const pullingDownAtTop = deltaY > 0 && atTop;
    const pushingUpAtBottom = e.deltaY > 0 && atBottom;

    if (!pullingDownAtTop && !pushingUpAtBottom) {
      return; // allow natural scrolling
    }

    // Disable wheel-based elastic to prevent any jank or jumps on desktop
    state.lastScrollEl = scrollEl;
    return;

  };

  return { handleWheel };
};
