/**
 * Contact: client-side validation with inline errors and an animated
 * success state, submitting via EmailJS (loaded as a classic <script> in
 * contact.html — see index.js of that SDK) straight from the browser to
 * the owner's inbox, no backend of our own required.
 */
const EMAILJS_SERVICE_ID = 'service_yndtllm';
const EMAILJS_TEMPLATE_ID = 'template_derstma';
const EMAILJS_PUBLIC_KEY = 'Ol-E41z7_j3bWsqtA';
const VALIDATORS = {
  name: (v) => v.trim().length >= 2 || 'Enter your full name.',
  company: (v) => v.trim().length >= 2 || 'Enter your company name.',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address.',
  phone: (v) => v.trim() === '' || /^[+()\d\s-]{7,20}$/.test(v.trim()) || 'Enter a valid phone number.',
  requirement: (v) => v.trim().length >= 10 || 'Tell us a little more about what you need (10+ characters).',
  quantity: () => true,
};

let form, gsapRef;

function validateField(field) {
  const validator = VALIDATORS[field.name];
  if (!validator) return true;
  const result = validator(field.value);
  const errorEl = document.getElementById(field.id + '-error');
  field.dataset.touched = 'true';
  if (result === true) {
    field.setAttribute('aria-invalid', 'false');
    if (errorEl) errorEl.textContent = '';
    return true;
  }
  field.setAttribute('aria-invalid', 'true');
  if (errorEl) errorEl.textContent = result;
  return false;
}

// The SDK's own <script> tag lives in contact.html's footer, outside
// #page-content — transitions.js's SPA swap only replaces that element, it
// never re-executes <script> tags from the rest of the fetched document, so
// arriving here via an in-app nav click (rather than a full page load)
// leaves window.emailjs permanently undefined otherwise. Loading it here
// instead, on this page's own init(), works regardless of how the visitor
// arrived. Cached so navigating away and back doesn't inject a second copy.
let emailjsReady = null;
function loadEmailJS() {
  if (window.emailjs) return Promise.resolve();
  if (!emailjsReady) {
    emailjsReady = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'js/vendor/emailjs.min.js?v=20';
      script.onload = resolve;
      script.onerror = () => { emailjsReady = null; reject(new Error('EmailJS SDK failed to load')); };
      document.head.appendChild(script);
    });
  }
  return emailjsReady;
}

async function submitEnquiry(data) {
  await loadEmailJS();
  return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, data, EMAILJS_PUBLIC_KEY);
}

function handleSubmit(e) {
  e.preventDefault();
  const fields = Array.from(form.querySelectorAll('input, textarea'));
  const allValid = fields.map(validateField).every(Boolean);
  if (!allValid) {
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  const submitBtn = form.querySelector('[type="submit"]');
  const submitBtnOriginalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  const formData = Object.fromEntries(new FormData(form).entries());
  const errorEl = document.getElementById('contact-error');
  if (errorEl) errorEl.style.display = 'none';

  submitEnquiry(formData).then(() => {
    const status = document.getElementById('contact-status');
    gsapRef.to(form, {
      autoAlpha: 0, y: -12, duration: 0.35, ease: 'power2.in',
      onComplete: () => {
        form.setAttribute('hidden', '');
        status.classList.add('is-visible');
        status.setAttribute('tabindex', '-1');
        status.focus();
      },
    });
  }).catch((err) => {
    console.error('Enquiry submission failed:', err);
    submitBtn.disabled = false;
    submitBtn.innerHTML = submitBtnOriginalHTML;
    if (errorEl) errorEl.style.display = '';
  });
}

export function init({ gsap }) {
  form = document.getElementById('enquiry-form');
  gsapRef = gsap;
  if (!form) return;

  loadEmailJS().catch(() => {}); // start now so it's likely ready by submit time; submitEnquiry awaits it regardless

  form.querySelectorAll('input, textarea').forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
  });

  form.addEventListener('submit', handleSubmit);
}

export function destroy() {
  form = null;
}
