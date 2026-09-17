/**
 * Custom geometric cursor. Desktop / fine-pointer only — never instantiated
 * on touch devices. Lerps toward the real pointer position for a light drag
 * feel, and scales + recolours over interactive elements.
 */
import { capabilities } from './device.js';

const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [role="button"], .cursor-interactive';

export function initCursor() {
  if (!capabilities.finePointer || capabilities.touch) return;

  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let raf = null;

  window.addEventListener('pointermove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    el.classList.remove('is-hidden');
  }, { passive: true });

  window.addEventListener('pointerdown', () => el.classList.add('is-active'));
  window.addEventListener('pointerup', () => {
    if (!document.querySelector(':hover')?.closest(INTERACTIVE_SELECTOR)) {
      el.classList.remove('is-active');
    }
  });

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

  function tick() {
    x += (targetX - x) * 0.22;
    y += (targetY - y) * 0.22;
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    raf = requestAnimationFrame(tick);
  }
  tick();

  document.body.classList.add('has-custom-cursor');

  return () => {
    cancelAnimationFrame(raf);
    el.remove();
  };
}
