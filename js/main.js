/**
 * Bootstrap. GSAP + ScrollTrigger load as classic global <script>s (see each
 * HTML <head>) for a smaller, well-cached UMD build; everything else here
 * is a native ES module. Three.js is only dynamically imported when
 * `canUseWebGLScene()` says so, so its ~170KB gzip never blocks first paint
 * or ships to reduced-motion/low-end/touch visitors at all.
 */
import { capabilities, canUseWebGLScene } from './core/device.js';
import { initSmoothScroll } from './core/smooth-scroll.js';
import { initCursor } from './core/cursor.js';
import { initNav, initScrollProgress, markActiveLink } from './core/nav.js';
import { initReveals, clearRevealTriggers } from './core/reveal.js';
import { initTransitions } from './core/transitions.js';
import { initFallback, initFlowyVideo } from './three/fallback.js';

import * as homePage from './pages/home.js';
import * as aboutPage from './pages/about.js';
import * as capabilitiesPage from './pages/capabilities.js';
import * as whyIndrevaPage from './pages/why-indreva.js';
import * as visionPage from './pages/vision.js';
import * as contactPage from './pages/contact.js';

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

  initCursor();
  initNav(gsap);
  initScrollProgress();
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
      sceneModule = await import('./three/scene.js');
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
