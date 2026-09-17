/**
 * Header condense-on-scroll, mobile overlay menu with staggered diagonal
 * reveals, and active-link marking. Pure DOM/CSS-class toggling so it keeps
 * working across the fake-SPA page swaps without re-binding per navigation.
 */
export function initNav(gsap) {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const overlay = document.querySelector('.nav-overlay');
  if (!header) return;

  let lastState = false;
  function onScroll() {
    const condensed = window.scrollY > 40;
    if (condensed !== lastState) {
      header.classList.toggle('is-condensed', condensed);
      lastState = condensed;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && overlay) {
    const items = overlay.querySelectorAll('.nav-overlay__links a, .nav-overlay__cta');
    gsap.set(overlay, { xPercent: 100 }); // establish GSAP's own baseline, see components.css note

    const openMenu = () => {
      toggle.setAttribute('aria-expanded', 'true');
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      gsap.set(overlay, { visibility: 'visible' });
      gsap.fromTo(overlay, { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: 'expo.out' });
      gsap.fromTo(items,
        { opacity: 0, x: 60, skewX: -6 },
        { opacity: 1, x: 0, skewX: 0, duration: 0.5, stagger: 0.06, delay: 0.12, ease: 'power3.out' }
      );
      overlay.querySelector('a')?.focus();
    };

    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      gsap.to(overlay, {
        xPercent: 100,
        duration: 0.4,
        ease: 'power3.in',
        onComplete: () => {
          overlay.classList.remove('is-open');
          gsap.set(overlay, { visibility: 'hidden' });
        },
      });
      toggle.focus();
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu();
    });
  }

  markActiveLink();
}

export function markActiveLink() {
  const current = document.body.dataset.page;
  document.querySelectorAll('.nav-links a, .nav-overlay__links a').forEach((a) => {
    if (a.dataset.page === current) {
      a.setAttribute('aria-current', 'page');
    } else {
      a.removeAttribute('aria-current');
    }
  });
}

export function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress__bar');
  if (!bar) return;
  function update() {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}
