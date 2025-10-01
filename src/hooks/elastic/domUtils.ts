
export const getMainContainer = () => {
  // Priority order for finding the elastic container - target the main content area
  return (
    document.querySelector('[data-elastic-container="true"]') ||
    document.querySelector('.flex.w-full.h-\\[calc\\(100vh-56px\\)\\]') ||
    document.querySelector('[data-scroll-container="true"]') ||
    document.querySelector('.profile-scroll-container') ||
    document.querySelector('main') ||
    document.body
  );
};

export const isAtBoundary = (element: Element, direction: 'top' | 'left' | 'right'): boolean => {
  if (direction === 'top') {
    return element.scrollTop <= 2;
  } else if (direction === 'left') {
    return element.scrollLeft <= 2;
  } else if (direction === 'right') {
    return element.scrollLeft >= (element.scrollWidth - element.clientWidth - 2);
  }
  return false;
};

export const findScrollableParent = (element: Element): Element | null => {
  if (!element || element === document.body) return document.documentElement;
  
  const { overflow, overflowY, overflowX } = window.getComputedStyle(element);
  const isScrollable = /(auto|scroll)/.test(overflow + overflowY + overflowX);
  
  if (isScrollable && (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth)) {
    return element;
  }
  
  return findScrollableParent(element.parentElement!);
};
