/** Home: animated trust-strip counters. Everything else uses the generic reveal system. */
let countTweens = [];

export function init({ gsap, capabilities }) {
  const values = document.querySelectorAll('[data-count-to]');
  if (!values.length) return;

  values.forEach((el) => {
    const target = parseInt(el.dataset.countTo, 10);
    const suffix = el.dataset.suffix || '';
    if (capabilities.reducedMotion) {
      el.textContent = target + suffix;
      return;
    }
    const proxy = { val: 0 };
    const tween = gsap.to(proxy, {
      val: target,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = Math.round(proxy.val) + suffix; },
    });
    countTweens.push(tween);
  });
}

export function destroy() {
  countTweens.forEach((t) => t.kill());
  countTweens = [];
}
