/**
 * Capabilities: each .cap-chapter already gets a distinct camera moment for
 * free, since the page-level waypoint (waypoints.js -> capabilities) scrubs
 * continuously across the whole page and four chapters divide that range
 * evenly. This module only adds a subtle per-chapter index parallax.
 */
let triggers = [];

export function init({ gsap, ScrollTrigger }) {
  document.querySelectorAll('.cap-chapter__index').forEach((el) => {
    const t = gsap.fromTo(el,
      { yPercent: -12 },
      {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('.cap-chapter'), start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
    triggers.push(t.scrollTrigger);
  });
}

export function destroy() {
  triggers.forEach((t) => t.kill());
  triggers = [];
}
