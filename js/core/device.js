/**
 * Capability detection. Every other module reads from this instead of
 * re-testing matchMedia/navigator itself, so the whole site degrades
 * consistently from one source of truth.
 */

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
const fineOnly = window.matchMedia('(pointer: fine)').matches && !coarsePointerQuery.matches;

function detectLowEnd() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 560;
  return cores <= 4 && mem <= 4 && smallViewport;
}

export const capabilities = {
  reducedMotion: reduceMotionQuery.matches,
  touch: coarsePointerQuery.matches || 'ontouchstart' in window,
  finePointer: fineOnly,
  lowEnd: detectLowEnd(),
  saveData: !!(navigator.connection && navigator.connection.saveData),
};

/** WebGL scene only runs when all of these hold. */
export function canUseWebGLScene() {
  if (capabilities.reducedMotion) return false;
  if (capabilities.saveData) return false;
  if (capabilities.lowEnd) return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

export function canUseSmoothScroll() {
  return !capabilities.reducedMotion && !capabilities.touch;
}

reduceMotionQuery.addEventListener('change', (e) => {
  capabilities.reducedMotion = e.matches;
  document.dispatchEvent(new CustomEvent('capabilities:change', { detail: capabilities }));
});
