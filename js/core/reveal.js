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
import { capabilities } from './device.js?v=20';

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
  initParallax(gsap);
  initCanvasHandoff(gsap);
  refreshOnImageLoad(ScrollTrigger);
}

/**
 * The floating 3D mark lives on a fixed canvas *behind* the page content, so
 * a full-width opaque photograph scrolling over it used to slice it off at
 * the image's hard edge — the mark and the picture read as two unrelated
 * layers colliding rather than one composition.
 *
 * Instead the mark dissolves as a .media-hero rises to cover it, stays out
 * while the photograph owns the screen, and returns once it has passed. The
 * timeline is scrubbed to scroll so the handoff tracks the scroll position
 * both ways rather than firing as a one-shot.
 *
 * Opacity, not autoAlpha: scene.js owns the canvas's visibility/layout for
 * its own per-page framing, and toggling visibility here would fight it.
 */
function initCanvasHandoff(gsap) {
  const canvas = document.getElementById('scene-canvas');
  if (!canvas) return; // no-WebGL path drops the canvas entirely
  // A page swap kills the previous page's triggers wherever they happened to
  // be, so start from a known-visible canvas rather than whatever opacity the
  // outgoing page's handoff was mid-way through.
  gsap.set(canvas, { opacity: 1 });
  const heroes = document.querySelectorAll('#page-content .media-hero');
  if (!heroes.length) return;
  heroes.forEach((hero) => {
    gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top 90%', end: 'bottom 10%', scrub: 0.6 },
    })
      .to(canvas, { opacity: 0, ease: 'power1.out', duration: 0.25 })
      .to(canvas, { opacity: 0, duration: 0.5 })
      .to(canvas, { opacity: 1, ease: 'power1.in', duration: 0.25 });
  });
}

/**
 * Triggers are measured against the layout as it stands when they're
 * created. Photography is lazy-loaded and the frames are sized by
 * aspect-ratio, so that's usually stable — but any image that lands late
 * and does shift the page leaves every trigger below it measured against
 * stale positions, which strands content that should have revealed. One
 * refresh once the images have settled re-measures them all.
 */
function refreshOnImageLoad(ScrollTrigger) {
  const pending = [...document.querySelectorAll('#page-content img')].filter((img) => !img.complete);
  if (!pending.length) return;
  let left = pending.length;
  const done = () => {
    left -= 1;
    if (left <= 0) ScrollTrigger.refresh();
  };
  pending.forEach((img) => {
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });
}

/**
 * Scroll parallax for the layered media compositions (components.css).
 * Each [data-parallax] element drifts by its own factor as its section
 * crosses the viewport, so the ghost word, the main image and the
 * overlapping inset all travel at different rates — that difference is
 * what reads as depth.
 *
 * Never put [data-parallax] on an element that also carries [data-reveal]:
 * both compile to the same CSS transform, and the two tweens then overwrite
 * each other every frame — visibly, as a shake while the element enters the
 * viewport. Parallax goes on the inner <img>, the reveal on its <figure>.
 *
 * The small `scrub` number rather than `true` lets the tween ease toward
 * the scroll position over ~0.6s instead of snapping to it each frame,
 * which absorbs the jitter of coarse wheel deltas.
 *
 * Skipped entirely under reduced-motion: parallax is pure movement, so
 * there's nothing to degrade it to.
 */
function initParallax(gsap) {
  if (capabilities.reducedMotion) return;
  document.querySelectorAll('[data-parallax]').forEach((el) => {
    const distance = parseFloat(el.dataset.parallax) || 0;
    if (!distance) return;
    gsap.fromTo(el, { yPercent: distance }, {
      yPercent: -distance,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('section') || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
  });
}

/** Called after a page swap, before the old ScrollTriggers for that content are gone. */
export function clearRevealTriggers(ScrollTrigger) {
  ScrollTrigger.getAll().forEach((t) => t.kill());
}
