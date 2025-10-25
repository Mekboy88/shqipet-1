
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
    
    // EASIER ELASTIC: allow pull-down only when ACTIVE container is at top
    if (deltaY > 0.2) {
      const target = e.target as Element;

      // Ignore if inside a horizontal scroller
      if ((target as HTMLElement).closest('[data-horizontal-scroll="true"]')) return;

      const scrollEl = getNearestScrollContainer(target) as HTMLElement;
      const atTop = scrollEl ? scrollEl.scrollTop <= 0 : (window.pageYOffset === 0 && document.documentElement.scrollTop === 0);

      // If any content above is scrolled, block
      let hasContentScroll = false;
      if (scrollEl && scrollEl.scrollTop > 0) {
        hasContentScroll = true;
      }

      if (atTop && !hasContentScroll) {
        // More elastic (easier) resistance curve for touch
        const pullDistance = Math.abs(deltaY);
        const elasticMultiplier = 6.4;
        const maxDistance = 280;

        const normalizedDistance = Math.min(pullDistance / maxDistance, 1);
        const baseResistance = 0.23;
        const midResistance = 0.12;
        const maxResistance = 0.04;

        let progressiveResistance;
        if (normalizedDistance < 0.3) {
          const lightCurve = normalizedDistance / 0.3;
          progressiveResistance = baseResistance - (baseResistance - midResistance) * Math.pow(lightCurve, 0.6);
        } else {
          const strongCurve = (normalizedDistance - 0.3) / 0.7;
          progressiveResistance = midResistance - (midResistance - maxResistance) * Math.pow(strongCurve, 3.0);
        }

        const distanceBasedResistance = Math.max(0.05, 1 - (pullDistance / 24));
        const combinedDamping = progressiveResistance * distanceBasedResistance;
        const elasticDeltaY = deltaY * elasticMultiplier * combinedDamping;

        const targetStretchY = Math.min(elasticDeltaY, maxDistance);

        state.isElasticActive = true;
        state.currentStretchY = targetStretchY;

        const element = getTransformTarget(scrollEl || document.documentElement) as HTMLElement | null;
        if (element) {
          state.lastTransformEl = element;
          state.lastScrollEl = scrollEl || document.documentElement;
          element.style.setProperty('will-change', 'transform', 'important');
          element.style.setProperty('backface-visibility', 'hidden', 'important');
          element.style.setProperty('transform-style', 'preserve-3d', 'important');
          element.style.setProperty('contain', 'paint layout style size', 'important');
          element.style.setProperty('transform', `translate3d(0, ${targetStretchY}px, 0)`, 'important');
          element.style.setProperty('transition', 'none', 'important');
          element.style.setProperty('transform-origin', 'center top', 'important');
        }

        // Update elastic indicator visual
        updateIndicator(state.lastScrollEl || scrollEl || document.documentElement, Math.max(0, targetStretchY));

        e.preventDefault();
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
        element.style.setProperty('transition', 'transform 0.42s cubic-bezier(0.25, 1.6, 0.45, 0.94)', 'important'); // Facebook-like bounce

        // Remove will-change after animation completes
        setTimeout(() => {
          element.style.removeProperty('will-change');
          element.style.removeProperty('transition');
          element.style.removeProperty('backface-visibility');
          element.style.removeProperty('transform-style');
          element.style.removeProperty('contain');
        }, 460);
      }
      
      // Hide indicator smoothly
      if (state.lastScrollEl) hideIndicator(state.lastScrollEl as HTMLElement);
      
      // Reset state with Facebook-like timing
      setTimeout(() => {
        state.isElasticActive = false;
        state.currentStretchX = 0;
        state.currentStretchY = 0;
        state.lastTransformEl = null;
        state.lastScrollEl = null;
      }, 120); // Slightly longer for smoother feel
    }
  };

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
};
