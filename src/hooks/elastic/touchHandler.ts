
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
    
    // Check for disabled elastic
    const target = e.target as Element;
    if (target?.closest('[data-elastic-disabled="true"]')) return;
    
    // Frame-based throttling using requestAnimationFrame
    const now = Date.now();
    if (now - lastTouchTime < 16) return; // ~60fps
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
        const pullDistance = Math.abs(deltaY);
        const { maxElasticDistance, elasticityMultiplier, resistanceCurve } = state.config;

        // Resistance curve based on config
        let baseResistance = 0.23;
        let midResistance = 0.12;
        let maxResistance = 0.04;

        if (resistanceCurve === 'soft') {
          baseResistance = 0.28;
          midResistance = 0.16;
          maxResistance = 0.06;
        } else if (resistanceCurve === 'firm') {
          baseResistance = 0.20;
          midResistance = 0.09;
          maxResistance = 0.02;
        }

        const normalizedDistance = Math.min(pullDistance / maxElasticDistance, 1);
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
        const elasticDeltaY = deltaY * elasticityMultiplier * combinedDamping;

        // Directly apply calculated stretch without dampening
        state.isElasticActive = true;
        state.currentStretchY = Math.min(elasticDeltaY, maxElasticDistance);

        // Apply transform immediately to create visible bounce
        const element = getTransformTarget(scrollEl || document.documentElement) as HTMLElement | null;
        if (element) {
          state.lastTransformEl = element;
          state.lastScrollEl = scrollEl || document.documentElement;
          element.style.willChange = 'transform';
          element.style.backfaceVisibility = 'hidden';
          element.style.transformStyle = 'preserve-3d';
          element.style.transform = `translate3d(0, ${state.currentStretchY}px, 0)`;
          element.style.transition = 'none';
          element.style.transformOrigin = 'center top';
        }

        // Update elastic indicator if enabled
        if (state.config.indicatorEnabled && state.lastScrollEl) {
          updateIndicator(state.lastScrollEl, Math.max(0, state.currentStretchY));
        }

        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (state.isScrolling) {
      state.isScrolling = false;
    }
    
    // Elastic snap-back with smooth bounce
    if (state.isElasticActive) {
      const element = state.lastTransformEl as HTMLElement | null;
      
      if (element) {
        element.style.transition = 'transform 0.4s cubic-bezier(0.25, 1.6, 0.45, 0.94)';
        element.style.transform = 'translate3d(0, 0, 0)';

        // Clean up all temporary styles after animation
        setTimeout(() => {
          element.style.willChange = '';
          element.style.transition = '';
          element.style.backfaceVisibility = '';
          element.style.transformStyle = '';
          element.style.transform = '';
        }, 440);
      }
      
      // Hide indicator smoothly if enabled
      if (state.config.indicatorEnabled && state.lastScrollEl) {
        hideIndicator(state.lastScrollEl as HTMLElement);
      }
      
      // Reset state
      setTimeout(() => {
        state.isElasticActive = false;
        state.currentStretchX = 0;
        state.currentStretchY = 0;
        state.scrollSpeed = 0;
        state.lastTransformEl = null;
        state.lastScrollEl = null;
      }, 120);
    }
  };

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
};
