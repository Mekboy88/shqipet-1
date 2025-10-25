
import { ElasticState } from './types';

export const createScrollHandler = (state: ElasticState) => {
  const handleScroll = () => {
    // Relaxed scroll protection: don't interrupt active elastic bounce
    if (state.isElasticActive) {
      // Let elastic finish; ignore this scroll event
      return;
    }
    
    // Mark scrolling active with gentle debounce
    state.isScrolling = true;
    
    // Clear any existing timeout
    if (state.scrollTimeout) {
      clearTimeout(state.scrollTimeout);
    }
    
    // Slightly longer debounce for smoother behavior (prevents flicker)
    state.scrollTimeout = setTimeout(() => {
      state.isScrolling = false;
    }, 150);
  };

  return { handleScroll };
};
