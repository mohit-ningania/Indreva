/**
 * Click-to-enlarge for the layered photography.
 *
 * The stacked compositions (components.css) deliberately crop and overlap
 * their frames, so a viewer never sees a whole photograph. Clicking any of
 * them opens it full-size; the hover lift on the inset is the desktop
 * affordance, this is the one that also works on touch.
 *
 * Built on <dialog>.showModal() rather than a hand-rolled overlay: it gives
 * focus trapping, Escape-to-close, inertness of the page behind it and the
 * top-layer stacking (above the fixed header and the WebGL canvas) for free,
 * all of which are easy to get subtly wrong by hand.
 *
 * Binding is delegated from `document`, so the fake-SPA page swaps
 * (transitions.js replaces #page-content wholesale) never need to rebind it
 * — and the dialog itself lives outside #page-content so a swap can't
 * destroy it mid-open.
 */
import { getLenis } from './smooth-scroll.js?v=20';

const TRIGGER_SELECTOR = '[data-lightbox]';

let dialog = null;
let imgEl = null;
let captionEl = null;
let lastTrigger = null;

function buildDialog() {
  dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.innerHTML = `
    <button class="lightbox__close cursor-interactive" type="button" aria-label="Close image">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18"/>
      </svg>
    </button>
    <figure class="lightbox__figure">
      <img class="lightbox__img" alt="">
      <figcaption class="lightbox__caption"></figcaption>
    </figure>`;
  document.body.appendChild(dialog);

  imgEl = dialog.querySelector('.lightbox__img');
  captionEl = dialog.querySelector('.lightbox__caption');

  dialog.querySelector('.lightbox__close').addEventListener('click', close);

  // Clicking the backdrop — i.e. the dialog's own box, not the figure inside
  // it — closes. `::backdrop` isn't itself an event target, so the dialog
  // element standing in for it is the usual way to catch this.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.classList.contains('lightbox__figure')) close();
  });

  // Escape fires `cancel` natively; intercept so the close animation runs
  // instead of the dialog vanishing in one frame.
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });

  return dialog;
}

function lockScroll(locked) {
  const lenis = getLenis();
  if (lenis) locked ? lenis.stop() : lenis.start();
  // Belt and braces for the native-scroll path (touch / reduced-motion),
  // where there is no Lenis instance to stop.
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

function open(trigger) {
  const source = trigger.querySelector('img');
  if (!source) return;

  if (!dialog) buildDialog();

  lastTrigger = trigger;
  imgEl.src = source.currentSrc || source.src;
  imgEl.alt = source.alt || '';
  captionEl.textContent = source.alt || '';
  captionEl.hidden = !source.alt;

  dialog.showModal();
  lockScroll(true);
  // Next frame, so the opening transition has a from-state to animate out of.
  requestAnimationFrame(() => dialog.classList.add('is-open'));
}

function close() {
  if (!dialog || !dialog.open) return;
  dialog.classList.remove('is-open');
  const finish = () => {
    dialog.close();
    lockScroll(false);
    // Send focus back where it came from, so a keyboard user isn't dropped
    // at the top of the document after closing.
    lastTrigger?.focus?.();
    lastTrigger = null;
  };
  const onDone = (e) => {
    if (e.target !== dialog) return;
    dialog.removeEventListener('transitionend', onDone);
    finish();
  };
  dialog.addEventListener('transitionend', onDone);
  // Transitions don't fire if the element is display:none or motion is
  // reduced — never leave the dialog stuck open waiting for an event.
  setTimeout(() => {
    if (dialog.open && !dialog.classList.contains('is-open')) {
      dialog.removeEventListener('transitionend', onDone);
      finish();
    }
  }, 400);
}

export function initLightbox() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest(TRIGGER_SELECTOR);
    if (!trigger) return;
    e.preventDefault();
    open(trigger);
  });

  // A [data-lightbox] figure is given role="button" + tabindex in markup, so
  // it has to answer the keys a real button would.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    const trigger = e.target.closest?.(TRIGGER_SELECTOR);
    if (!trigger) return;
    e.preventDefault();
    open(trigger);
  });
}
