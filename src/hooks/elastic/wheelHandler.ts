
import { ElasticState } from './types';
import { findScrollableParent, getNearestScrollContainer, getTransformTarget } from './domUtils';
import { applyElasticTransform } from './elasticTransform';

export const createWheelHandler = (state: ElasticState) => {
  let resetTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastWheelTime = 0;
  
  const handleWheel = (e: WheelEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Ignore horizontal scrollers and horizontal-dominant wheels
    if (target.closest('[data-horizontal-scroll="true"]')) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

    const scrollEl = (getNearestScrollContainer(target) as HTMLElement) || (findScrollableParent(target) as HTMLElement) || document.documentElement;
    if (!scrollEl) return;

    // Must be at the very top of the ACTIVE scroll container and moving upward fast
    const deltaY = -e.deltaY;
    const atTop = (scrollEl as HTMLElement).scrollTop <= 0;
    const fastUpward = deltaY > 12; // require speed to avoid premature bounce

    if (!(fastUpward && atTop)) {
      return; // allow natural scrolling
    }

    // Throttle for smoothness
    const now = Date.now();
    if (now - lastWheelTime < 4) return;
    lastWheelTime = now;

    state.isElasticActive = true;

    // More elastic feel for wheel
    const currentDistance = Math.abs(state.currentStretchY);
    const elasticMultiplier = 9.6;
    const maxDistance = 280;

    const normalizedDistance = Math.min(currentDistance / maxDistance, 1);
    const baseResistance = 0.21;
    const midResistance = 0.11;
    const maxResistance = 0.02;

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
    const elasticDelta = deltaY * elasticMultiplier * combinedResistance;

    const targetStretch = Math.min(state.currentStretchY + elasticDelta, maxDistance);
    const result = applyElasticTransform(0, targetStretch, state.currentStretchX, state.currentStretchY);
    state.currentStretchX = result.currentStretchX;
    state.currentStretchY = result.currentStretchY;

    const container = getTransformTarget(scrollEl) as HTMLElement | null;
    state.lastTransformEl = container;
    if (container) {
      container.style.setProperty('will-change', 'transform', 'important');
      container.style.setProperty('backface-visibility', 'hidden', 'important');
      container.style.setProperty('transform-style', 'preserve-3d', 'important');
      container.style.setProperty('contain', 'paint layout style size', 'important');
      container.style.setProperty('transform', `translate3d(0, ${state.currentStretchY}px, 0)`, 'important');
      container.style.setProperty('transition', 'none', 'important');
      container.style.setProperty('transform-origin', 'center top', 'important');
    }

    // Idle-based snap-back (prevents flicker)
    if (resetTimeout) clearTimeout(resetTimeout);
    resetTimeout = setTimeout(() => {
      const element = state.lastTransformEl as HTMLElement | null;
      if (element) {
        element.style.setProperty('transition', 'transform 0.42s cubic-bezier(0.25, 1.6, 0.45, 0.94)', 'important');
        element.style.setProperty('transform', 'translate3d(0, 0, 0)', 'important');
        setTimeout(() => {
          element.style.removeProperty('will-change');
          element.style.removeProperty('transition');
          element.style.removeProperty('backface-visibility');
          element.style.removeProperty('transform-style');
          element.style.removeProperty('contain');
        }, 460);
      }
      state.isElasticActive = false;
      state.currentStretchX = 0;
      state.currentStretchY = 0;
      state.lastTransformEl = null;
      resetTimeout = null;
    }, 220);

    e.preventDefault();
  };

  return { handleWheel };
};
