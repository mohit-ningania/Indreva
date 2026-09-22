/**
 * Inertia-based smooth scroll (Lenis), wired into the GSAP ticker so every
 * ScrollTrigger-driven animation (reveals, the 3D camera rig, the vision
 * horizontal track) reads the same interpolated scroll position instead of
 * the raw, stepped native one. Disabled outright on touch devices and under
 * prefers-reduced-motion — native scroll takes over transparently there.
 */
import { canUseSmoothScroll } from './device.js?v=17';

let lenisInstance = null;

export function getLenis() {
  return lenisInstance;
}

export async function initSmoothScroll(gsap, ScrollTrigger) {
  if (!canUseSmoothScroll()) {
    document.documentElement.classList.add('native-scroll');
    return null;
  }

  const { default: Lenis } = await import('../vendor/lenis.mjs');

  const lenis = new Lenis({
    // A fast flick used to glide for up to 1.15s of heavy deceleration —
    // long enough that the glide swept past several sections' reveal
    // triggers within a couple hundred milliseconds of real time, so their
    // 0.7s entrance animations piled up and overlapped instead of settling
    // one at a time. Shorter duration keeps the weighted, non-native feel
    // without letting one flick outrun that many triggers at once.
    duration: 0.75,
    easing: (t) => 1 - Math.pow(1 - t, 4), // heavy, weighted deceleration — no rubber-band overshoot
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
    infinite: false,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  lenisInstance = lenis;
  document.documentElement.classList.add('lenis');
  return lenis;
}

export function destroySmoothScroll() {
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}

/** Used by the page-transition layer to jump to top without a visible native scroll. */
export function scrollToTopInstant() {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo(0, 0);
  }
}
