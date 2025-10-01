
import { ElasticState } from './types';
import { findScrollableParent, isAtBoundary } from './domUtils';
import { applyElasticTransform, resetElastic } from './elasticTransform';

export const createWheelHandler = (state: ElasticState) => {
  let resetTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastWheelTime = 0;
  
  const handleWheel = (e: WheelEvent) => {
    const target = e.target as Element;
    if (!target) return;
    
    // Check if we're over the main feed content area
    const isOverFeedContent = target.closest('[data-scroll-container="true"]') ||
                              target.closest('.feed-content') ||
                              target.closest('#feed-content') ||
                              target.closest('#feed-container') ||
                              target.closest('.max-w-\\[756px\\]');
    
    // If we're over the main feed content, handle it properly
    if (isOverFeedContent) {
      const feedContainer = target.closest('[data-scroll-container="true"]') as HTMLElement;
      
      // Only apply elastic if at the very top of the feed AND scrolling up (pull-down)
      if (feedContainer && feedContainer.scrollTop <= 0 && e.deltaY < 0) {
        console.log('WHEEL - Feed at top, applying elastic pull-down');
        // Apply elastic effect - continue to elastic logic below
      } else {
        // For all other cases (scrolling down, or scrolling up when not at top), 
        // let the feed container handle it naturally - DON'T block the event
        console.log('WHEEL - Normal feed scrolling, allowing natural scroll');
        return; // Let the browser handle normal scrolling
      }
    } else {
      // Not over feed content - check for elastic on other elements
      const scrollableElement = findScrollableParent(target);
      if (!scrollableElement) return;
      
      const deltaY = -e.deltaY;
      
      // Only apply elastic at boundary
      if (!(deltaY > 0 && isAtBoundary(scrollableElement, 'top') && window.pageYOffset === 0)) {
        return; // Not at boundary, allow normal scrolling
      }
    }
    
    // Ultra-smooth throttling for maximum smoothness - 240fps
    const now = Date.now();
    if (now - lastWheelTime < 4) return; // 240fps for ultra-smooth response
    lastWheelTime = now;
    
    // ABSOLUTE SCROLL PROTECTION - Check for any scroll activity
    if (state.isScrolling || window.pageYOffset > 0 || document.documentElement.scrollTop > 0) {
      console.log('SCROLL PROTECTION - Wheel blocked, scroll activity detected');
      return;
    }
    
    const scrollableElement = findScrollableParent(target);
    if (!scrollableElement) return;
    
    const deltaY = -e.deltaY;
    
    // EASIER ELASTIC: Only at absolute top with upward scroll - reduced resistance by 60%
    if (deltaY > 0 && isAtBoundary(scrollableElement, 'top') && window.pageYOffset === 0) {
      if (resetTimeout) {
        clearTimeout(resetTimeout);
        resetTimeout = null;
      }
      
      state.isElasticActive = true;
      
      // EASIER ELASTIC for wheel input - reduced resistance by 60%
      const currentDistance = Math.abs(state.currentStretchY);
      const elasticMultiplier = 7.2; // Keep same multiplier
      const maxDistance = 280; // Keep same max distance
      
      // Much easier progressive resistance for wheel - reduced by 60%
      const normalizedDistance = Math.min(currentDistance / maxDistance, 1);
      
      // Reduced resistance curve by 60%
      const baseResistance = 0.25; // Was 0.62, now 60% easier
      const midResistance = 0.13; // Was 0.32, now 60% easier
      const maxResistance = 0.02; // Was 0.06, now 60% easier
      
      // EASIER progressive damping for wheel
      let progressiveResistance;
      if (normalizedDistance < 0.3) {
        const lightCurve = normalizedDistance / 0.3;
        progressiveResistance = baseResistance - (baseResistance - midResistance) * Math.pow(lightCurve, 0.8);
      } else {
        const strongCurve = (normalizedDistance - 0.3) / 0.7;
        progressiveResistance = midResistance - (midResistance - maxResistance) * Math.pow(strongCurve, 3.0);
      }
      
      // EASIER distance resistance for wheel - reduced by 60%
      const distanceResistance = Math.max(0.07, 1 - (currentDistance / 22)); // Was 0.18 and /55, now much easier
      
      // Combine for much easier wheel elasticity
      const combinedResistance = progressiveResistance * distanceResistance;
      const elasticDelta = deltaY * elasticMultiplier * combinedResistance;
      
      const targetStretch = Math.min(state.currentStretchY + elasticDelta, maxDistance);
      const result = applyElasticTransform(0, targetStretch, state.currentStretchX, state.currentStretchY);
      state.currentStretchX = result.currentStretchX;
      state.currentStretchY = result.currentStretchY;
      
      console.log('EASIER WHEEL ELASTIC (60% less resistance) - Delta:', deltaY, 'Target:', targetStretch.toFixed(1), 'Resistance:', (1 - combinedResistance).toFixed(2));
      
      // Facebook-style reset timing
      resetTimeout = setTimeout(() => {
        if (state.isElasticActive) {
          resetElastic();
          state.isElasticActive = false;
          state.currentStretchX = 0;
          state.currentStretchY = 0;
        }
        resetTimeout = null;
      }, 100); // Slightly longer for Facebook feel
      
      e.preventDefault();
    }
  };

  return { handleWheel };
};
