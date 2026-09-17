/**
 * Static/low-cost fallback for low-end devices, saveData, or reduced motion.
 * No Three.js is ever imported in this path. `#scene-fallback` (a CSS
 * gradient, see layout.css) is already visible by default; this only adds
 * an optional, very cheap ambient drift — skipped entirely under
 * prefers-reduced-motion.
 */
import { capabilities } from '../core/device.js';

export function initFallback() {
  const el = document.getElementById('scene-fallback');
  if (!el) return;

  document.getElementById('scene-canvas')?.remove();

  if (capabilities.reducedMotion) return;

  let raf;
  let t = 0;
  function tick() {
    t += 0.0015;
    const x = 15 + Math.sin(t) * 6;
    const y = 85 + Math.cos(t * 0.8) * 6;
    el.style.backgroundPosition = `${x}% 0%, ${y}% 100%, 0 0`;
    raf = requestAnimationFrame(tick);
  }
  tick();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else tick();
  });
}
