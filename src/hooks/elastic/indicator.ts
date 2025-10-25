
export const getOrCreateIndicator = (scrollEl: HTMLElement): HTMLElement => {
  // Ensure the scroll container can anchor absolute children
  try {
    const cs = getComputedStyle(scrollEl);
    if (cs.position === 'static') {
      scrollEl.style.position = 'relative';
    }
  } catch {}

  let indicator = scrollEl.querySelector<HTMLElement>(`:scope > [data-elastic-indicator="true"]`);
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.setAttribute('data-elastic-indicator', 'true');
    indicator.style.position = 'absolute';
    indicator.style.top = '0';
    indicator.style.left = '0';
    indicator.style.width = '100%';
    indicator.style.height = '6px'; // Increased from 4px for better visibility
    indicator.style.transformOrigin = 'top center';
    indicator.style.transform = 'scaleY(1)';
    indicator.style.opacity = '0';
    indicator.style.zIndex = '9999';
    indicator.style.pointerEvents = 'none';
    indicator.style.willChange = 'transform, opacity';
    indicator.style.background = 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.6))';
    indicator.style.borderRadius = '3px';
    indicator.style.boxShadow = '0 2px 8px hsl(var(--primary) / 0.3)';
    indicator.style.transition = 'opacity 0.2s ease';

    // Insert at very top (but don't become the transform target)
    if (scrollEl.firstElementChild) {
      scrollEl.insertBefore(indicator, scrollEl.firstElementChild);
    } else {
      scrollEl.appendChild(indicator);
    }
  }
  return indicator;
};

export const updateIndicator = (scrollEl: HTMLElement, distance: number) => {
  if (!scrollEl) return;
  const indicator = getOrCreateIndicator(scrollEl);
  
  // More aggressive elastic scaling: grows much faster when pulling
  const scale = 1 + Math.max(0, distance) / 40; // Changed from 150 to 40 for more visible stretch
  const opacity = Math.min(1, Math.max(0, distance) / 60); // Changed from 120 to 60 for faster fade-in
  
  indicator.style.opacity = `${opacity}`;
  indicator.style.transition = 'none';
  indicator.style.transform = `scaleY(${scale})`;
};

export const hideIndicator = (scrollEl: HTMLElement) => {
  const indicator = scrollEl?.querySelector<HTMLElement>(':scope > [data-elastic-indicator="true"]');
  if (!indicator) return;
  indicator.style.transition = 'transform 0.4s cubic-bezier(0.25, 1.6, 0.45, 0.94), opacity 0.3s ease';
  indicator.style.transform = 'scaleY(1)';
  indicator.style.opacity = '0';
};
