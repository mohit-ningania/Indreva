# Vendored libraries

Pinned locally (not CDN) so the site runs fully offline and predictably:

- `three.module.min.js` — three.js r160, MIT (see THREE-LICENSE)
- `gsap.min.js`, `ScrollTrigger.min.js` — GSAP 3.12.5 (see GSAP-README.md; GSAP and its bonus plugins including ScrollTrigger are free under Webflow's license as of 2025)
- `lenis.mjs` — Lenis 1.1.18, MIT (see LENIS-LICENSE)

Total gzip footprint: ~213KB, well under the 400KB JS budget. three.js is only
fetched via dynamic import when the WebGL scene is actually used (see
js/main.js), so it never blocks first paint or ships to reduced-motion /
low-end / touch visitors.
