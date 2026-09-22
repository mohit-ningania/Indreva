/**
 * Scroll-triggered entrance system: translate-up + fade reveals for generic
 * content, plus word-level split reveals for headlines. No SplitText
 * dependency — a small manual splitter keeps the bundle light and avoids
 * any plugin licensing question.
 *
 * Accessibility: the split markup is presentational only. The original
 * text is preserved as an aria-label on the wrapper and every generated
 * span is aria-hidden, so screen readers hear the sentence once, normally.
 *
 * prefers-reduced-motion: the CSS media query in base.css collapses
 * *CSS* transition/animation durations, but it cannot touch these
 * GSAP-driven tweens (GSAP writes inline styles per frame, not CSS
 * transitions). So this module checks `capabilities.reducedMotion` itself
 * and swaps every translate+fade for an opacity-only fade with no
 * movement, per the brief's "fall back to simple fades" requirement.
 */
import { capabilities } from './device.js?v=20260922';

export function splitWords(el) {
  if (el.dataset.split === 'done') return el.querySelectorAll('.split-word');
  const temp = document.createElement('div');
  temp.innerHTML = el.innerHTML.replace(/<br\s*\/?>/gi, ' ');
  el.setAttribute('aria-label', temp.textContent.trim().replace(/\s+/g, ' '));
  el.dataset.split = 'done';
  // Each <br> becomes its own block-level `.split-line`, so an author's
  // intentional line break stays fixed regardless of viewport width. Left
  // as a plain space (the old behaviour), the browser's own word-wrap
  // decides line groupings on its own — which combination of words lands
  // on which line then shifts around at different widths, so a wide-enough
  // window can pull an extra word onto what was meant to be a short first
  // line and push it much further right than any single source line alone
  // (e.g. "Connecting Markets. Creating" instead of just "Connecting
  // Markets.") — exactly the gap a fixed layout (like the floating 3D mark
  // beside this title) can't defend against.
  const lines = el.innerHTML.split(/<br\s*\/?>/gi);
  el.innerHTML = lines
    .map((line) => {
      const lineEl = document.createElement('div');
      lineEl.innerHTML = line;
      const words = lineEl.textContent.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
      return `<span class="split-line">${words.map((w) => `<span class="split-word" aria-hidden="true">${w}</span>`).join(' ')}</span>`;
    })
    .join('');
  return el.querySelectorAll('.split-word');
}

export function revealHeadline(el, gsap, opts = {}) {
  const words = splitWords(el);
  gsap.set(words, { display: 'inline-block' });

  if (capabilities.reducedMotion) {
    return gsap.fromTo(words, { opacity: 0 }, {
      opacity: 1, duration: 0.4, stagger: 0.02,
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
    });
  }

  return gsap.fromTo(
    words,
    { yPercent: 120, opacity: 0, rotateZ: 4 },
    {
      yPercent: 0,
      opacity: 1,
      rotateZ: 0,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.045,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      },
      ...opts,
    }
  );
}

/**
 * Generic reveal-on-scroll for any [data-reveal] element: fades up on
 * entry, staggered by data-reveal-group siblings. Diagonal-leaning y+x
 * offset echoes the site's movement motif instead of a plain vertical fade.
 */
export function initReveals(gsap, ScrollTrigger) {
  document.body.classList.add('js-ready');

  const fromState = capabilities.reducedMotion
    ? { autoAlpha: 0 }
    : { autoAlpha: 0, y: 32, x: -12 };
  const toBase = capabilities.reducedMotion
    ? { autoAlpha: 1, duration: 0.35, ease: 'none' }
    // Shortened from 0.7s: a fast scroll sweeps past several triggers within
    // a couple hundred milliseconds of real time, and at 0.7s each these
    // were still overlapping the next section's own reveal instead of
    // settling first — several stacked, half-finished fades all visible at
    // once instead of one section revealing cleanly after another.
    : { autoAlpha: 1, y: 0, x: 0, duration: 0.45, ease: 'power3.out' };

  const groups = new Map();
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    el.classList.add('reveal', 'is-ready');
    const group = el.dataset.revealGroup || null;
    if (group) {
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(el);
    } else {
      gsap.fromTo(el, fromState, {
        ...toBase,
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
      });
    }
  });

  groups.forEach((els) => {
    gsap.fromTo(els, fromState, {
      ...toBase,
      stagger: capabilities.reducedMotion ? 0.03 : 0.12,
      scrollTrigger: { trigger: els[0], start: 'top 90%', toggleActions: 'play none none reverse' },
    });
  });

  document.querySelectorAll('[data-split-headline]').forEach((el) => revealHeadline(el, gsap));
}

/** Called after a page swap, before the old ScrollTriggers for that content are gone. */
export function clearRevealTriggers(ScrollTrigger) {
  ScrollTrigger.getAll().forEach((t) => t.kill());
}
