/**
 * Vision: horizontal scroll-jacked growth path (Sourcing -> Distribution ->
 * Manufacturing -> International Trade). Sticky-pins `.horizon-pin` (native
 * CSS, see vision.css) and translates the four-stage track while the 3D
 * monogram morphs across the same scroll range (see scene.bindVisionHorizontal
 * for why this isn't built on GSAP ScrollTrigger's `pin`). Skipped entirely
 * under reduced motion — CSS (vision.css) stacks the stages vertically
 * instead — and on narrow viewports, where the same CSS switches the track
 * to a normal vertical column.
 */
const MOBILE_BREAKPOINT = 720;
let cleanupHorizontal = null;

export function init({ gsap, scene, capabilities }) {
  const wrapper = document.getElementById('horizon');
  const track = document.getElementById('horizon-track');
  const dots = document.querySelectorAll('.horizon-progress__dot');
  if (!wrapper || !track) return;

  const setActiveDot = (index) => {
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };
  setActiveDot(0);

  // CSS handles the static stacked layout in both cases — position:sticky
  // pinning a 100vh viewport over a horizontally-scrolling track doesn't
  // make sense once the track itself is a plain vertical column.
  if (capabilities.reducedMotion || window.innerWidth <= MOBILE_BREAKPOINT) return;

  if (scene) {
    cleanupHorizontal = scene.bindVisionHorizontal(wrapper, track, setActiveDot);
  } else {
    // No 3D scene (fallback path) — still deliver the horizontal scroll-jack,
    // via the same native sticky + scroll-listener approach (no ScrollTrigger).
    let extra = 0;
    const recalc = () => {
      extra = Math.max(track.scrollWidth - window.innerWidth, 0);
      wrapper.style.height = `calc(100svh + ${extra}px)`;
    };
    recalc();
    window.addEventListener('resize', recalc);

    let queued = false;
    const update = () => {
      queued = false;
      const rect = wrapper.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      gsap.set(track, { x: -progress * extra });
      setActiveDot(Math.round(progress * (dots.length - 1)));
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    cleanupHorizontal = () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', onScroll);
      wrapper.style.height = '';
    };
  }
}

export function destroy() {
  cleanupHorizontal?.();
  cleanupHorizontal = null;
}
