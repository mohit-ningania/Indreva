# Vendored libraries

Pinned locally (not CDN) so the site runs fully offline and predictably:

- `three.module.min.js` — three.js r160, MIT (see THREE-LICENSE)
- `gsap.min.js`, `ScrollTrigger.min.js` — GSAP 3.12.5 (see GSAP-README.md; GSAP and its bonus plugins including ScrollTrigger are free under Webflow's license as of 2025)
- `lenis.mjs` — Lenis 1.1.18, MIT (see LENIS-LICENSE)
- `emailjs.min.js` — @emailjs/browser 4.4.1, BSD-3-Clause (see EMAILJS-LICENSE). Contact-page-only, not part of the shared bundle above — was loaded from jsdelivr originally, moved here after a real submission silently failed client-side (most likely an ad-blocker or network filter dropping the cdn.jsdelivr.net request — `window.emailjs` never even got defined, so the failure happened before any request reached EmailJS's API at all). Self-hosting removes that whole failure class the same way GSAP/Three/Lenis already are.

Total gzip footprint: ~213KB, well under the 400KB JS budget. three.js is only
fetched via dynamic import when the WebGL scene is actually used (see
js/main.js), so it never blocks first paint or ships to reduced-motion /
low-end / touch visitors.
