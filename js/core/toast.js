/**
 * Minimal toast + click-to-copy fallback for mailto: links. A mailto: href
 * only does anything visible if the browser actually has a default mail
 * handler registered — plenty of desktop Chrome installs don't, so the
 * click can silently no-op with nothing on screen to explain why. Copying
 * the address alongside the normal mailto: attempt means every visitor
 * gets a usable outcome from the click regardless of whether their browser
 * has a handler wired up — worst case they paste it into whatever mail
 * app or webmail they actually use.
 *
 * Event-delegated on document, so one call at boot covers every page —
 * this never needs re-binding after an SPA content swap.
 */
let toastEl = null;
let hideTimer = null;

function showToast(message) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
}

export function initMailtoCopy() {
  if (!navigator.clipboard?.writeText) return; // no usable fallback to offer
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="mailto:"]');
    if (!link) return;
    const email = link.getAttribute('href').slice('mailto:'.length).split('?')[0];
    if (!email) return;
    navigator.clipboard.writeText(email)
      .then(() => showToast(`Copied ${email} — paste it into your mail app`))
      .catch(() => {});
  });
}
