
import { ElasticState } from './types';
import { createElasticHandler } from './elasticHandler';
import { createTouchScrollHandler } from './touchScrollHandler';
import { getNearestScrollContainer, getTransformTarget } from './domUtils';

export const createTouchHandlers = (state: ElasticState) => {
  const elasticHandler = createElasticHandler(state);
  const scrollHandler = createTouchScrollHandler(state);
  let lastTouchTime = 0;

  const handleTouchStart = (e: TouchEvent) => {
    // ABSOLUTE SCROLL PROTECTION - Zero tolerance for interference
    if (state.isScrolling || window.pageYOffset > 0 || document.documentElement.scrollTop > 0) {
      console.log('SCROLL PROTECTION - Touch start blocked, prioritizing scroll');
      return;
    }
    
    // Additional protection - check for any scrollable content
    const target = e.target as Element;
    if (target && target.closest('[data-scroll-container="true"]')) {
      const scrollContainer = target.closest('[data-scroll-container="true"]') as HTMLElement;
      if (scrollContainer && scrollContainer.scrollTop > 0) {
        console.log('SCROLL PROTECTION - Content scroll detected, blocking elastic');
        return;
      }
    }
    
    state.startX = e.touches[0].clientX;
    state.startY = e.touches[0].clientY;
    
    if (state.animationFrame) {
      cancelAnimationFrame(state.animationFrame);
    }
    if (state.scrollTimeout) {
      clearTimeout(state.scrollTimeout);
      state.scrollTimeout = null;
    }

    console.log('FACEBOOK-STYLE TOUCH START - Absolute scroll protection active');
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!e.touches[0]) return;
    
    // Ultra-smooth throttling for Facebook-like feel
    const now = Date.now();
    if (now - lastTouchTime < 4) return;
    lastTouchTime = now;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - state.startX;
    const deltaY = currentY - state.startY;
    
    if (Math.abs(deltaX) < 0.2 && Math.abs(deltaY) < 0.2) return;
    
    // ABSOLUTE SCROLL PROTECTION
    if (state.isScrolling || window.pageYOffset > 0 || document.documentElement.scrollTop > 0) {
      console.log('SCROLL PROTECTION - Elastic completely blocked during scroll');
      state.isElasticActive = false;
      state.currentStretchX = 0;
      state.currentStretchY = 0;
      
      const container = document.querySelector('[data-elastic-container="true"]');
      if (container) {
        const element = container as HTMLElement;
        element.style.setProperty('transform', 'translate3d(0, 0, 0)', 'important');
        element.style.setProperty('transition', 'none', 'important');
      }
      return;
    }
    
    // Block horizontal movement for scroll protection
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      console.log('SCROLL PROTECTION - Horizontal movement blocked');
      state.isScrolling = true;
      return;
    }
    
    // EASIER ELASTIC: REDUCED RESISTANCE BY 60% for pull-down at absolute top
    if (deltaY > 0.2) {
      const isAtAbsoluteTop = window.pageYOffset === 0 && document.documentElement.scrollTop === 0;
      
      const target = e.target as Element;
      let hasContentScroll = false;
      if (target) {
        const scrollContainer = target.closest('[data-scroll-container="true"]') as HTMLElement;
        if (scrollContainer && scrollContainer.scrollTop > 0) {
          hasContentScroll = true;
        }
      }
      
      if (isAtAbsoluteTop && !hasContentScroll) {
        // EASIER ELASTIC for touch - reduced resistance by 60%
        const pullDistance = Math.abs(deltaY);
        const elasticMultiplier = 5.8; // Keep same multiplier
        const maxDistance = 280; // Keep same max distance
        
        // MUCH EASIER resistance curve - reduced by 60%
        const normalizedDistance = Math.min(pullDistance / maxDistance, 1);
        
        // Reduced resistance values by 60%
        const baseResistance = 0.27; // Was 0.68, now 60% easier
        const midResistance = 0.15; // Was 0.38, now 60% easier  
        const maxResistance = 0.04; // Was 0.10, now 60% easier
        
        // EASIER progressive damping
        let progressiveResistance;
        if (normalizedDistance < 0.3) {
          const lightCurve = normalizedDistance / 0.3;
          progressiveResistance = baseResistance - (baseResistance - midResistance) * Math.pow(lightCurve, 0.6);
        } else {
          const strongCurve = (normalizedDistance - 0.3) / 0.7;
          progressiveResistance = midResistance - (midResistance - maxResistance) * Math.pow(strongCurve, 3.2);
        }
        
        // EASIER distance resistance for touch - reduced by 60%
        const distanceBasedResistance = Math.max(0.05, 1 - (pullDistance / 20)); // Was 0.12 and /50, now much easier
        
        // Combine for much easier touch elasticity
        const combinedDamping = progressiveResistance * distanceBasedResistance;
        const elasticDeltaY = deltaY * elasticMultiplier * combinedDamping;
        
        const targetStretchY = Math.min(elasticDeltaY, maxDistance);
        
        state.isElasticActive = true;
        state.currentStretchY = targetStretchY;
        
        const scrollEl = getNearestScrollContainer(target as Element) as HTMLElement;
        const element = getTransformTarget(scrollEl) as HTMLElement | null;
        if (element) {
          state.lastTransformEl = element;
          element.style.setProperty('will-change', 'transform', 'important');
          element.style.setProperty('transform', `translate3d(0, ${targetStretchY}px, 0)`, 'important');
          element.style.setProperty('transition', 'none', 'important');
          element.style.setProperty('transform-origin', 'center top', 'important');
        }
        
        e.preventDefault();
        
        console.log('EASIER TOUCH ELASTIC (60% less resistance) - Stretch:', targetStretchY.toFixed(1), 'Resistance:', (1 - combinedDamping).toFixed(2), 'Distance:', pullDistance.toFixed(1));
      } else {
        console.log('SCROLL PROTECTION - Not at absolute top or content has scroll');
      }
    }
  };

  const handleTouchEnd = () => {
    console.log('FACEBOOK-STYLE TOUCH END - Elastic active:', state.isElasticActive);
    
    if (state.isScrolling) {
      state.isScrolling = false;
    }
    
    // FACEBOOK-STYLE elastic snap-back
    if (state.isElasticActive) {
      const element = state.lastTransformEl as HTMLElement | null;
      
      if (element) {
        element.style.setProperty('transform', 'translate3d(0, 0, 0)', 'important');
        element.style.setProperty('transition', 'transform 0.35s cubic-bezier(0.25, 1.6, 0.45, 0.94)', 'important'); // Facebook-like bounce
        
        // Remove will-change after animation completes
        setTimeout(() => {
          element.style.removeProperty('will-change');
          element.style.removeProperty('transition');
        }, 400);
      }
      
      // Reset state with Facebook-like timing
      setTimeout(() => {
        state.isElasticActive = false;
        state.currentStretchX = 0;
        state.currentStretchY = 0;
        state.lastTransformEl = null;
      }, 120); // Slightly longer for smoother feel
    }
  };

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
};
