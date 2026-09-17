/**
 * Vision: horizontal scroll-jacked growth path (Sourcing -> Distribution ->
 * Manufacturing -> International Trade). Pins the section and translates
 * the four-stage track while the 3D monogram morphs across the same scrub
 * (see scene.bindVisionHorizontal). Skipped entirely under reduced motion —
 * CSS (vision.css) stacks the stages vertically instead.
 */
let cleanupHorizontal = null;

export function init({ gsap, ScrollTrigger, scene, capabilities }) {
  const container = document.getElementById('horizon-pin');
  const track = document.getElementById('horizon-track');
  const dots = document.querySelectorAll('.horizon-progress__dot');
  if (!container || !track) return;

  const setActiveDot = (index) => {
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };
  setActiveDot(0);

  if (capabilities.reducedMotion) return; // CSS handles the static stacked layout

  if (scene) {
    cleanupHorizontal = scene.bindVisionHorizontal(container, track, setActiveDot);
  } else {
    // No 3D scene (fallback path) — still deliver the horizontal scroll-jack via GSAP alone.
    const distance = () => Math.max(track.scrollWidth - window.innerWidth, 0);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: () => '+=' + distance(),
        scrub: 1,
        pin: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => setActiveDot(Math.round(self.progress * (dots.length - 1))),
      },
    });
    cleanupHorizontal = () => tween.scrollTrigger?.kill();
  }
}

export function destroy() {
  cleanupHorizontal?.();
  cleanupHorizontal = null;
}
