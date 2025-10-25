
import { ElasticState } from './types';

export const createScrollHandler = (state: ElasticState) => {
  const handleScroll = () => {
    // ABSOLUTE SCROLL PROTECTION - Instant disable elastic on ANY scroll with zero tolerance
    if (state.isElasticActive) {
      console.log('SCROLL PROTECTION - INSTANT elastic disable for absolute scroll protection');
      state.isElasticActive = false;
      state.currentStretchX = 0;
      state.currentStretchY = 0;
      
      // Instant reset transforms for absolute scroll protection
      const containers = [
        document.querySelector('[data-elastic-container="true"]'),
        document.querySelector('.flex.w-full.h-\\[calc\\(100vh-56px\\)\\]'),
        document.querySelector('[data-scroll-container="true"]'),
        document.querySelector('.profile-scroll-container')
      ];
      
      containers.forEach(container => {
        if (container) {
          const element = container as HTMLElement;
          element.style.setProperty('transform', 'translate3d(0, 0, 0)', 'important');
          element.style.setProperty('transition', 'none', 'important');
        }
      });
    }
    
    // Instant scroll protection activation with zero delay
    state.isScrolling = true;
    
    // Clear any existing timeout
    if (state.scrollTimeout) {
      clearTimeout(state.scrollTimeout);
    }
    
    // Ultra-fast scroll protection reset - reduced from 100ms to 50ms
    state.scrollTimeout = setTimeout(() => {
      console.log('SCROLL PROTECTION - Ultra-fast scroll protection reset');
      state.isScrolling = false;
    }, 50); // 2x faster timing for better protection
  };

  return { handleScroll };
};
