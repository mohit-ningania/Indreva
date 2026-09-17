/**
 * Contact: client-side validation with inline errors and an animated
 * success state. No network submission target exists yet, so a valid
 * submit is treated as successfully queued and the form is replaced with
 * a confirmation — swap the fetch() stub in `submitEnquiry` for a real
 * endpoint when one exists.
 */
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

async function submitEnquiry(data) {
  // Placeholder: no backend wired up yet. Simulated latency keeps the
  // success animation honest about async submission.
  await new Promise((resolve) => setTimeout(resolve, 700));
  return { ok: true, data };
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
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  const formData = Object.fromEntries(new FormData(form).entries());

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
  });
}

export function init({ gsap }) {
  form = document.getElementById('enquiry-form');
  gsapRef = gsap;
  if (!form) return;

  form.querySelectorAll('input, textarea').forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
  });

  form.addEventListener('submit', handleSubmit);
}

export function destroy() {
  form = null;
}
