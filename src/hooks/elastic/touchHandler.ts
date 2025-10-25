
import { ElasticState } from './types';
import { createElasticHandler } from './elasticHandler';
import { createTouchScrollHandler } from './touchScrollHandler';
import { getNearestScrollContainer, getTransformTarget } from './domUtils';
import { updateIndicator, hideIndicator } from './indicator';

export const createTouchHandlers = (state: ElasticState) => {
  const elasticHandler = createElasticHandler(state);
  const scrollHandler = createTouchScrollHandler(state);
  let lastTouchTime = 0;

  const handleTouchStart = (e: TouchEvent) => {
    state.startX = e.touches[0].clientX;
    state.startY = e.touches[0].clientY;
    
    if (state.animationFrame) {
      cancelAnimationFrame(state.animationFrame);
    }
    if (state.scrollTimeout) {
      clearTimeout(state.scrollTimeout);
      state.scrollTimeout = null;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!e.touches[0]) return;
    
    const target = e.target as Element;
    if (target?.closest('[data-elastic-disabled="true"]')) return;
    
    const now = Date.now();
    if (now - lastTouchTime < 16) return; // ~60fps throttle
    lastTouchTime = now;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - state.startX;
    const deltaY = currentY - state.startY;
    
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
    
    // Block horizontal movement
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      state.isScrolling = true;
      return;
    }
    
    // Elastic at boundaries: top pull-down or bottom push-up
    if (deltaY > 1 || deltaY < -1) {
      if ((target as HTMLElement).closest('[data-horizontal-scroll="true"]')) return;

      let scrollEl = getNearestScrollContainer(target) as HTMLElement | null;
      if (!scrollEl) scrollEl = document.documentElement as unknown as HTMLElement;

      // Ensure indicator can attach to correct scroll context
      state.lastScrollEl = scrollEl;

      const atTop = scrollEl.scrollTop <= 0;
      const atBottom = Math.ceil(scrollEl.scrollTop + scrollEl.clientHeight) >= scrollEl.scrollHeight;

      const { maxElasticDistance, elasticityMultiplier } = state.config;

      if (deltaY > 1 && atTop) {
        // Pulling down at top -> positive stretch
        const elasticDelta = deltaY * elasticityMultiplier * 0.25;
        state.currentStretchY = Math.min(elasticDelta, maxElasticDistance);
      } else if (deltaY < -1 && atBottom) {
        // Pushing up at bottom -> negative stretch
        const elasticDelta = deltaY * elasticityMultiplier * 0.25; // negative
        state.currentStretchY = Math.max(elasticDelta, -maxElasticDistance);
      } else {
        // Not at a boundary; still ensure indicator hides if it was shown
        if (state.config.indicatorEnabled && state.lastScrollEl) {
          hideIndicator(state.lastScrollEl as HTMLElement);
        }
        return;
      }

      let element = getTransformTarget(scrollEl) as HTMLElement | null;
      // If transform target is body, use real content (skip indicator)
      if (element === document.body) {
        let candidate = document.body.firstElementChild as HTMLElement | null;
        if (candidate && candidate.getAttribute('data-elastic-indicator') === 'true') {
          candidate = candidate.nextElementSibling as HTMLElement | null;
        }
        if (candidate) element = candidate;
      }
      const indicatorEl = scrollEl.querySelector(':scope > [data-elastic-indicator="true"]') as HTMLElement | null;
      if (indicatorEl && element === indicatorEl) {
        element = (indicatorEl.nextElementSibling as HTMLElement) || element;
      }
      if (element) {
        state.lastTransformEl = element;
        state.lastScrollEl = scrollEl;

        if (!state.isElasticActive) {
          element.style.willChange = 'transform';
          element.style.transition = 'none';
        }

        state.isElasticActive = true;
        element.style.transform = `translate3d(0, ${state.currentStretchY}px, 0)`;
      }

      if (state.config.indicatorEnabled && state.lastScrollEl) {
        console.debug('[elastic-indicator] touch', { atTop, atBottom, distance: state.currentStretchY });
        updateIndicator(state.lastScrollEl, state.currentStretchY);
      }

      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (state.isScrolling) {
      state.isScrolling = false;
    }
    
    if (state.isElasticActive) {
      const element = state.lastTransformEl as HTMLElement | null;
      
      if (element) {
        element.style.transition = 'transform 0.42s cubic-bezier(0.25, 1.6, 0.45, 0.94)';
        element.style.transform = 'translate3d(0, 0, 0)';

        setTimeout(() => {
          element.style.transition = '';
          element.style.willChange = '';
        }, 460);
      }
      
      if (state.config.indicatorEnabled && state.lastScrollEl) {
        hideIndicator(state.lastScrollEl as HTMLElement);
      }
      
      setTimeout(() => {
        state.isElasticActive = false;
        state.currentStretchY = 0;
        state.lastTransformEl = null;
        state.lastScrollEl = null;
      }, 120);
    }
  };

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
};
