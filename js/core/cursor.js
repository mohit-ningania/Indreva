/**
 * Custom chrome-arrow cursor image. Desktop / fine-pointer only — never
 * instantiated on touch devices. Uses gsap.quickTo for frame-rate-independent
 * following (buttery on 60Hz and 120Hz+ displays alike, unlike a hand-rolled
 * per-frame lerp).
 */
import { capabilities } from './device.js?v=20';

const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [role="button"], .cursor-interactive';

export function initCursor(gsap) {
  if (!capabilities.finePointer || capabilities.touch) return;

  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img');
  img.className = 'cursor__img';
  img.src = 'assets/cursor/cursor-chrome.png';
  img.alt = '';
  el.appendChild(img);
  document.body.appendChild(el);

  const startX = window.innerWidth / 2;
  const startY = window.innerHeight / 2;
  gsap.set(el, { x: startX, y: startY });

  // quickTo pre-builds a tween per property — far cheaper than a fresh
  // gsap.to() every pointermove, and stays smooth independent of refresh rate.
  const moveX = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
  const moveY = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });

  window.addEventListener('pointermove', (e) => {
    moveX(e.clientX);
    moveY(e.clientY);
    el.classList.remove('is-hidden');
  }, { passive: true });

  window.addEventListener('pointerdown', () => el.classList.add('is-pressed'));
  window.addEventListener('pointerup', () => el.classList.remove('is-pressed'));

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest && e.target.closest(INTERACTIVE_SELECTOR)) {
      el.classList.add('is-active');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest(INTERACTIVE_SELECTOR)) {
      el.classList.remove('is-active');
    }
  });

  document.addEventListener('mouseleave', () => el.classList.add('is-hidden'));

  document.body.classList.add('has-custom-cursor');

  return () => el.remove();
}
