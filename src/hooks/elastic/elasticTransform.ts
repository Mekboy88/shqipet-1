
export const applyElasticTransform = (
  targetX: number, 
  targetY: number,
  currentStretchX: number,
  currentStretchY: number
) => {
  // COMPLETELY DISABLED - NO TRANSFORMS AT ALL
  console.log('🚫 Elastic transform completely disabled');
  return { currentStretchX: 0, currentStretchY: 0 };
};

export const resetElastic = () => {
  // FORCE REMOVE ALL TRANSFORMS FROM ALL ELEMENTS
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    const el = element as HTMLElement;
    if (el.style) {
      el.style.removeProperty('transform');
      el.style.removeProperty('scale');
      el.style.removeProperty('zoom');
      el.style.removeProperty('transition');
      el.style.removeProperty('animation');
      el.style.removeProperty('will-change');
    }
  });
  
  console.log('🚫 All transforms removed from all elements');
};
