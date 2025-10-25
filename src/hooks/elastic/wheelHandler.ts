
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

    const scrollEl = (getNearestScrollContainer(target) as HTMLElement) || (findScrollableParent(target) as HTMLElement) || document.documentElement;
    if (!scrollEl) return;

    // Calculate scroll speed
    const now = Date.now();
    const timeDelta = now - state.lastScrollTime;
    state.scrollSpeed = timeDelta > 0 ? Math.abs(e.deltaY) / timeDelta : 0;
    state.lastScrollTime = now;

    // Must be at the very top of the ACTIVE scroll container and moving upward fast
    const deltaY = -e.deltaY;
    const atTop = (scrollEl as HTMLElement).scrollTop <= 0;
    const fastUpward = deltaY > 10 && state.scrollSpeed > 0.5;

    if (!(fastUpward && atTop)) {
      return; // allow natural scrolling
    }

    state.isElasticActive = true;

    const currentDistance = Math.abs(state.currentStretchY);
    const { maxElasticDistance, elasticityMultiplier, resistanceCurve } = state.config;

    // Resistance curve based on config
    let baseResistance = 0.21;
    let midResistance = 0.11;
    let maxResistance = 0.02;

    if (resistanceCurve === 'soft') {
      baseResistance = 0.25;
      midResistance = 0.15;
      maxResistance = 0.05;
    } else if (resistanceCurve === 'firm') {
      baseResistance = 0.18;
      midResistance = 0.08;
      maxResistance = 0.01;
    }

    const normalizedDistance = Math.min(currentDistance / maxElasticDistance, 1);
    let progressiveResistance;
    
    if (normalizedDistance < 0.3) {
      const lightCurve = normalizedDistance / 0.3;
      progressiveResistance = baseResistance - (baseResistance - midResistance) * Math.pow(lightCurve, 0.8);
    } else {
      const strongCurve = (normalizedDistance - 0.3) / 0.7;
      progressiveResistance = midResistance - (midResistance - maxResistance) * Math.pow(strongCurve, 3.0);
    }

    const distanceResistance = Math.max(0.06, 1 - (currentDistance / 26));
    const combinedResistance = progressiveResistance * distanceResistance;
    const elasticDelta = deltaY * elasticityMultiplier * combinedResistance;

    // Directly apply the calculated stretch - no dampening
    state.currentStretchY = Math.min(state.currentStretchY + elasticDelta, maxElasticDistance);

    // Apply transform to the correct element immediately
    const container = getTransformTarget(scrollEl) as HTMLElement | null;
    state.lastTransformEl = container;
    state.lastScrollEl = scrollEl as HTMLElement;
    
    if (container) {
      container.style.willChange = 'transform';
      container.style.backfaceVisibility = 'hidden';
      container.style.transformStyle = 'preserve-3d';
      container.style.transform = `translate3d(0, ${state.currentStretchY}px, 0)`;
      container.style.transition = 'none';
      container.style.transformOrigin = 'center top';
    }

    // Update elastic indicator if enabled
    if (state.config.indicatorEnabled && state.lastScrollEl) {
      updateIndicator(state.lastScrollEl, Math.max(0, state.currentStretchY));
    }

    // Idle-based snap-back with 200ms debounce
    if (resetTimeout) clearTimeout(resetTimeout);
    resetTimeout = setTimeout(() => {
      const element = state.lastTransformEl as HTMLElement | null;
      if (element) {
        element.style.transition = 'transform 0.4s cubic-bezier(0.25, 1.6, 0.45, 0.94)';
        element.style.transform = 'translate3d(0, 0, 0)';
        
        setTimeout(() => {
          element.style.willChange = '';
          element.style.transition = '';
          element.style.backfaceVisibility = '';
          element.style.transformStyle = '';
          element.style.transform = '';
        }, 440);
      }

      // Hide indicator smoothly
      if (state.config.indicatorEnabled && state.lastScrollEl) {
        hideIndicator(state.lastScrollEl);
      }

      state.isElasticActive = false;
      state.currentStretchX = 0;
      state.currentStretchY = 0;
      state.scrollSpeed = 0;
      state.lastTransformEl = null;
      state.lastScrollEl = null;
      resetTimeout = null;
    }, 200);

    e.preventDefault();
  };

  return { handleWheel };
};
