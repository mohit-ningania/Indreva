/**
 * Bootstrap. GSAP + ScrollTrigger load as classic global <script>s (see each
 * HTML <head>) for a smaller, well-cached UMD build; everything else here
 * is a native ES module. Three.js is only dynamically imported when
 * `canUseWebGLScene()` says so, so its ~170KB gzip never blocks first paint
 * or ships to reduced-motion/low-end/touch visitors at all.
 *
 * CACHE-BUSTING: every local CSS <link>/JS <script> tag and every internal
 * import specifier across the whole site carries a shared `?v=N` query
 * string (currently 21) — GitHub Pages sets no explicit Cache-Control, so
 * without it a returning visitor's browser can serve a stale cached copy
 * of any of these files indefinitely, silently, with no way to tell from
 * the outside that they're not seeing the current code. This bit us for
 * real: several real fixes shipped invisibly to anyone who'd already
 * loaded the site once, because the version string never changed between
 * commits. ANY edit to a CSS or JS file (not HTML markup/content changes)
 * needs `v=21` bumped everywhere in the same commit — every occurrence,
 * across all 6 HTML files and every internal import — or the fix won't
 * actually reach anyone with a warm cache.
 */
import { capabilities, canUseWebGLScene } from './core/device.js?v=21';
import { initSmoothScroll } from './core/smooth-scroll.js?v=21';
import { initCursor } from './core/cursor.js?v=21';
import { initNav, initScrollProgress, markActiveLink } from './core/nav.js?v=21';
import { initReveals, clearRevealTriggers } from './core/reveal.js?v=21';
import { initTransitions } from './core/transitions.js?v=21';
import { initMailtoCopy } from './core/toast.js?v=21';
import { initFallback, initFlowyVideo } from './three/fallback.js?v=21';

import * as homePage from './pages/home.js?v=21';
import * as aboutPage from './pages/about.js?v=21';
import * as capabilitiesPage from './pages/capabilities.js?v=21';
import * as whyIndrevaPage from './pages/why-indreva.js?v=21';
import * as visionPage from './pages/vision.js?v=21';
import * as contactPage from './pages/contact.js?v=21';

const PAGE_MODULES = {
  home: homePage,
  about: aboutPage,
  capabilities: capabilitiesPage,
  'why-indreva': whyIndrevaPage,
  vision: visionPage,
  contact: contactPage,
};

async function boot() {
  document.documentElement.classList.remove('no-js');

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  initCursor(gsap);
  initNav(gsap);
  initScrollProgress();
  initMailtoCopy();
  await initSmoothScroll(gsap, ScrollTrigger);
  initReveals(gsap, ScrollTrigger);

  let sceneModule = null;
  const currentPage = () => document.body.dataset.page;

  // The flowy blob background (#scene-fallback) is the site's permanent
  // backdrop now, not just a no-WebGL substitute — it stays mounted either
  // way. When the WebGL scene is available, its alpha canvas renders the
  // dark monogram on top of these same blobs; when it isn't, initFallback()
  // just drops the now-unused canvas element and lets the CSS blobs run on
  // their own (no per-frame JS needed for them at all).
  if (canUseWebGLScene()) {
    try {
      sceneModule = await import('./three/scene.js?v=21');
      await sceneModule.initScene({
        gsap, ScrollTrigger,
        canvas: document.getElementById('scene-canvas'),
        initialPage: currentPage(),
      });
    } catch (err) {
      sceneModule = null;
      initFallback();
    }
  } else {
    initFallback();
  }

  initFlowyVideo(currentPage());

  const runPageInit = (pageKey) => {
    PAGE_MODULES[pageKey]?.init?.({ gsap, ScrollTrigger, scene: sceneModule, capabilities });
  };
  const runPageDestroy = (pageKey) => {
    PAGE_MODULES[pageKey]?.destroy?.();
  };

  runPageInit(currentPage());

  initTransitions({
    gsap,
    onBeforeLeave: runPageDestroy,
    onAfterEnter: runPageInit,
    onContentSwapped: () => {
      clearRevealTriggers(ScrollTrigger);
      initReveals(gsap, ScrollTrigger);
      markActiveLink();
      initFlowyVideo(currentPage());
    },
    travelTo: sceneModule?.travelTo,
    refreshForPage: sceneModule?.refreshForPage,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
