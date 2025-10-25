
export interface GlobalElasticOptions {
  enabled?: boolean;
  elasticity?: number;
  maxStretch?: number;
  damping?: number;
}

export interface ElasticState {
  isElasticActive: boolean;
  startX: number;
  startY: number;
  currentStretchX: number;
  currentStretchY: number;
  animationFrame: number | null;
  isScrolling: boolean;
  scrollTimeout: ReturnType<typeof setTimeout> | null;
  lastTransformEl?: HTMLElement | null;
}
