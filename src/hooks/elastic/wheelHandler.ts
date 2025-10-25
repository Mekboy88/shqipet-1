
import { ElasticState } from './types';
import { findScrollableParent, isAtBoundary, getNearestScrollContainer, getTransformTarget } from './domUtils';
import { applyElasticTransform } from './elasticTransform';

export const createWheelHandler = (state: ElasticState) => {
  let resetTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastWheelTime = 0;
  
  const handleWheel = (e: WheelEvent) => {
    const target = e.target as Element;
    if (!target) return;
    
    const scrollableElement = findScrollableParent(target);
    if (!scrollableElement) return;
    
    const deltaY = -e.deltaY;
    const atAbsoluteTop = (window.pageYOffset === 0 && document.documentElement.scrollTop === 0);
    const fastUpward = deltaY > 8; // require speed to avoid premature bounce
    
    // Only when scrolling up, at container top AND absolute page top
    if (!(fastUpward && isAtBoundary(scrollableElement, 'top') && atAbsoluteTop)) {
      return; // allow natural scrolling
    }
    
    // Throttle for smoothness
    const now = Date.now();
    if (now - lastWheelTime < 4) return;
    lastWheelTime = now;
    
    state.isElasticActive = true;
    
    // Easier elastic for wheel
    const currentDistance = Math.abs(state.currentStretchY);
    const elasticMultiplier = 7.2;
    const maxDistance = 220;
    
    const normalizedDistance = Math.min(currentDistance / maxDistance, 1);
    const baseResistance = 0.25;
    const midResistance = 0.13;
    const maxResistance = 0.02;
    
    let progressiveResistance;
    if (normalizedDistance < 0.3) {
      const lightCurve = normalizedDistance / 0.3;
      progressiveResistance = baseResistance - (baseResistance - midResistance) * Math.pow(lightCurve, 0.8);
    } else {
      const strongCurve = (normalizedDistance - 0.3) / 0.7;
      progressiveResistance = midResistance - (midResistance - maxResistance) * Math.pow(strongCurve, 3.0);
    }
    
    const distanceResistance = Math.max(0.07, 1 - (currentDistance / 22));
    const combinedResistance = progressiveResistance * distanceResistance;
    const elasticDelta = deltaY * elasticMultiplier * combinedResistance;
    
    const targetStretch = Math.min(state.currentStretchY + elasticDelta, maxDistance);
    const result = applyElasticTransform(0, targetStretch, state.currentStretchX, state.currentStretchY);
    state.currentStretchX = result.currentStretchX;
    state.currentStretchY = result.currentStretchY;
    
    const activeScroll = (getNearestScrollContainer(target) as HTMLElement) || (findScrollableParent(target) as HTMLElement) || document.documentElement;
    const container = getTransformTarget(activeScroll) as HTMLElement;
    state.lastTransformEl = container;
    if (container) {
      container.style.setProperty('will-change', 'transform', 'important');
      container.style.setProperty('transform', `translate3d(0, ${state.currentStretchY}px, 0)`, 'important');
      container.style.setProperty('transition', 'none', 'important');
      container.style.setProperty('transform-origin', 'center top', 'important');
    }
    
    // Smooth snap-back timing
    if (resetTimeout) clearTimeout(resetTimeout);
    resetTimeout = setTimeout(() => {
      if (state.isElasticActive) {
        const element = state.lastTransformEl as HTMLElement | null;
        if (element) {
          element.style.setProperty('transform', 'translate3d(0, 0, 0)', 'important');
          element.style.setProperty('transition', 'transform 0.35s cubic-bezier(0.25, 1.6, 0.45, 0.94)', 'important');
          setTimeout(() => {
            element.style.removeProperty('will-change');
            element.style.removeProperty('transition');
          }, 400);
        }
        state.isElasticActive = false;
        state.currentStretchX = 0;
        state.currentStretchY = 0;
        state.lastTransformEl = null;
      }
      resetTimeout = null;
    }, 150);
    
    e.preventDefault();
  };

  return { handleWheel };
};
