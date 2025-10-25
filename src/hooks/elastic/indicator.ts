
export const getOrCreateIndicator = (scrollEl: HTMLElement): HTMLElement => {
  const id = 'elastic-indicator';
  let indicator = scrollEl.querySelector<HTMLElement>(`:scope > [data-elastic-indicator="true"]`);
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.setAttribute('data-elastic-indicator', 'true');
    indicator.style.position = 'sticky';
    indicator.style.top = '0';
    indicator.style.left = '0';
    indicator.style.right = '0';
    indicator.style.height = '4px';
    indicator.style.transformOrigin = 'top center';
    indicator.style.transform = 'scaleY(1)';
    indicator.style.opacity = '0';
    indicator.style.zIndex = '5';
    indicator.style.pointerEvents = 'none';
    indicator.style.willChange = 'transform, opacity';
    indicator.style.background = 'hsl(var(--primary) / 0.18)';
    indicator.style.borderBottom = '1px solid hsl(var(--primary) / 0.3)';

    // Insert at very top
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
  const clamped = Math.max(0, Math.min(distance, 120));
  const scale = 1 + clamped / 20; // stronger visual elasticity
  const opacity = Math.min(1, clamped / 24);
  indicator.style.opacity = `${opacity}`;
  indicator.style.transition = 'transform 0.04s linear, opacity 0.12s ease-out';
  indicator.style.transform = `scaleY(${scale})`;
};

export const hideIndicator = (scrollEl: HTMLElement) => {
  const indicator = scrollEl?.querySelector<HTMLElement>(':scope > [data-elastic-indicator="true"]');
  if (!indicator) return;
  indicator.style.transition = 'transform 0.42s cubic-bezier(0.25, 1.6, 0.45, 0.94), opacity 0.2s ease-out';
  indicator.style.transform = 'scaleY(1)';
  indicator.style.opacity = '0';
};
