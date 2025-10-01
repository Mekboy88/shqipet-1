
import { ElasticState } from './types';
import { findScrollableParent, isAtBoundary } from './domUtils';
import { applyElasticTransform } from './elasticTransform';

export const createElasticHandler = (state: ElasticState) => {
  const canStartElastic = (startX: number, startY: number): boolean => {
    // COMPLETELY block if any scrolling is active
    if (state.isScrolling) {
      console.log('ELASTIC BLOCKED - Scrolling is active');
      return false;
    }
    
    // COMPLETELY block elastic - prioritize scrolling always
    console.log('ELASTIC BLOCKED - Scrolling prioritized over elastic');
    return false;
  };

  const handleElasticMove = (deltaY: number, e: TouchEvent): boolean => {
    // INSTANTLY block elastic during any activity
    console.log('ELASTIC MOVE BLOCKED - Preventing all elastic behavior');
    state.isElasticActive = false;
    state.currentStretchX = 0;
    state.currentStretchY = 0;
    return false;
  };

  const startElastic = (deltaY: number, e: TouchEvent): boolean => {
    // COMPLETELY disable elastic functionality to prevent conflicts
    console.log('ELASTIC START BLOCKED - Elastic completely disabled');
    return false;
  };

  return {
    canStartElastic,
    startElastic,
    handleElasticMove
  };
};
