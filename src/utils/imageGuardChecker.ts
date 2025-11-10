/**
 * Image Guard Checker - Development utility to ensure all images use .img-locked
 * Prevents blur by catching images that don't have the CSS guard utility applied
 */

const EXEMPT_PATTERNS = [
  /favicon\.ico$/i,
  /placeholder\.svg$/i,
  /^data:image\/svg/i, // Inline SVGs
];

const shouldCheckImage = (img: HTMLImageElement): boolean => {
  const src = img.src || img.getAttribute('src') || '';
  
  // Skip exempt images
  if (EXEMPT_PATTERNS.some(pattern => pattern.test(src))) {
    return false;
  }
  
  // Skip images in debug overlays
  if (img.closest('[class*="debug"]') || img.closest('[data-debug]')) {
    return false;
  }
  
  return true;
};

const checkImage = (img: HTMLImageElement) => {
  if (!shouldCheckImage(img)) return;
  
  const hasLocked = img.classList.contains('img-locked');
  const parentHasWrapper = img.closest('.img-locked-wrapper');
  
  if (!hasLocked) {
    const src = img.src || img.getAttribute('src') || 'unknown';
    const component = img.closest('[data-component]')?.getAttribute('data-component') || 
                     img.closest('[class*="component"]')?.className ||
                     'unknown component';
    
    console.warn(
      '⚠️ Image Guard Missing: Image without .img-locked class detected',
      {
        src: src.slice(0, 100),
        component,
        element: img,
        hasWrapper: !!parentHasWrapper,
        recommendation: 'Add .img-locked class to prevent blur from compositing'
      }
    );
  }
};

const checkAllImages = () => {
  const images = document.querySelectorAll('img');
  let missingCount = 0;
  
  images.forEach(img => {
    if (shouldCheckImage(img) && !img.classList.contains('img-locked')) {
      checkImage(img);
      missingCount++;
    }
  });
  
  if (missingCount === 0) {
    console.log('✅ Image Guard Check: All images protected with .img-locked');
  } else {
    console.warn(`⚠️ Image Guard Check: ${missingCount} image(s) missing .img-locked class`);
  }
};

export const initImageGuardChecker = () => {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('🔍 Image Guard Checker: Monitoring for unprotected images...');
  
  // Initial check after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(checkAllImages, 1000);
    });
  } else {
    setTimeout(checkAllImages, 1000);
  }
  
  // Monitor for dynamically added images
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLImageElement) {
          setTimeout(() => checkImage(node), 100);
        } else if (node instanceof HTMLElement) {
          node.querySelectorAll('img').forEach(img => {
            setTimeout(() => checkImage(img), 100);
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Periodic full scan (every 10 seconds)
  setInterval(checkAllImages, 10000);
};
