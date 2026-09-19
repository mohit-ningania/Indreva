/**
 * ============================================================================
 * PERSISTENT 3D SCROLL ENGINE
 * ============================================================================
 * One renderer/camera/monogram instance lives for the whole session (the
 * fake-SPA page-transition layer never tears this down, only calls
 * `travelTo()` on it). Two things drive every transform, both explained in
 * waypoints.js:
 *
 *   1. WITHIN a page   -> a scrubbed ScrollTrigger interpolates camera +
 *                         monogram between that page's `start`/`end`.
 *   2. BETWEEN pages   -> `travelTo()` GSAP-tweens from the outgoing page's
 *                         `end` to the incoming page's `start`, timed to
 *                         match the DOM diagonal wipe in transitions.js.
 *
 * Nothing here is keyframed on a timer — every value is either "current
 * scroll fraction of this page" or "current transition progress".
 * ============================================================================
 */
import * as THREE from '../vendor/three.module.min.js';
import { createMonogram, applyDispersion } from './monogram.js';
import { getWaypoint, VISION_STAGES } from './waypoints.js';
import { capabilities } from '../core/device.js';

let renderer, camera, scene, monogram, scrollRig;
let clock;
let currentPageKey = 'home';
let pageScrollTrigger = null;
let rafId = null;
let isVisible = true;
let gsapRef, ScrollTriggerRef;

/** transitionState !== null while travelTo() is running; the per-page
 *  ScrollTrigger callback yields to it so the two never fight the camera. */
let transitionState = null;

/** Vision's own pinned horizontal section drives the camera directly while
 *  true, so the generic per-page ScrollTrigger below steps aside instead of
 *  fighting it for camera.position/rotation on every scroll tick. */
let genericScrollSuspended = false;
export function setGenericScrollSuspended(value) {
  genericScrollSuspended = value;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function lerp3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

// Deep Blue-Grey (dark metal, the default on the site's light pages) vs
// Chrome Silver (light chrome, reserved for the dark-background Vision page).
const TONE_COLORS = { dark: 0x2e3a46, light: 0xb8bcc2 };
// A bright chrome look needs a brighter env reflection to read as chrome;
// the dark gunmetal tone needs a dimmer one or its own base colour washes
// out to near-white (metalness ~0.7 means reflection dominates over base
// colour). Each page's dimAtEnd (waypoints.js) is a fraction of this start.
const TONE_ENV_START = { dark: 0.65, light: 1.3 };
function applyMaterialTone(pageKey) {
  const tone = getWaypoint(pageKey).materialTone || 'dark';
  monogram.material.color.setHex(TONE_COLORS[tone]);
}

export async function initScene({ gsap, ScrollTrigger, canvas, initialPage }) {
  gsapRef = gsap;
  ScrollTriggerRef = ScrollTrigger;
  currentPageKey = initialPage;
  clock = new THREE.Clock();

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // DPR cap — perf guardrail
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);

  // scrollRig holds the camera-independent monogram orientation driven by
  // scroll; monogram's own ambient spin is applied to the group *inside* it
  // every frame, so the two rotations compose instead of fighting.
  scrollRig = new THREE.Group();
  scene.add(scrollRig);

  const built = createMonogram(renderer);
  monogram = built;
  // Biases the mark toward the right so left-aligned headlines keep clear
  // space, with enough margin that it doesn't crowd the right edge either.
  built.group.position.x = 1.75;
  scrollRig.add(built.group);

  // Lighting: deep blue-grey fill (ambient/hemi) + a cool key light for the
  // chrome highlights + an ice-blue rim light from behind, per brand spec.
  const hemi = new THREE.HemisphereLight(0x2e3a46, 0x1c2126, 0.9);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xf3f4f6, 1.3);
  key.position.set(3, 4, 5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xa9c6da, 1.1);
  rim.position.set(-4, 1, -3);
  scene.add(rim);

  window.addEventListener('resize', onResize);

  const canvasObserver = new IntersectionObserver((entries) => {
    isVisible = entries[0].isIntersecting;
  });
  canvasObserver.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop(); else startLoop();
  });

  applyPageWaypoint(currentPageKey, 0);
  bindScrollTrigger(currentPageKey);
  startLoop();

  return { camera, scene, renderer };
}

function onResize() {
  if (!renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Sets camera + monogram to the waypoint's interpolated state at fraction t
 * (0..1) of the given page.
 *
 * The mark reads "assembled -> break apart -> reassembled" across every
 * page's own scroll, not a one-way scatter: dispersion follows a sine arc
 * (0 at t=0 and t=1, peaking at wp.monogram.peakDispersion around t=0.5)
 * instead of a straight lerp between two endpoints. groupY sinks the whole
 * mark down in world space as t -> 1, so by the time the page has scrolled
 * to its footer the reassembled mark is settled half behind the footer's
 * opaque background — the canvas itself never clips it; the footer's own
 * z-index (above the canvas, see layout.css) does that naturally.
 */
function applyPageWaypoint(pageKey, t) {
  const wp = getWaypoint(pageKey);
  const cam = wp.camera;

  const pos = lerp3(cam.start.position, cam.end.position, t);
  const rot = lerp3(cam.start.rotation, cam.end.rotation, t);
  const fov = lerp(cam.start.fov, cam.end.fov, t);

  camera.position.set(...pos);
  camera.rotation.set(...rot);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);

  const dispersion = Math.sin(Math.min(Math.max(t, 0), 1) * Math.PI) * wp.monogram.peakDispersion;
  const scale = lerp(wp.monogram.scaleStart, wp.monogram.scaleEnd, t);
  applyDispersion(monogram.slabs, dispersion);
  monogram.group.scale.setScalar(scale);
  monogram.group.position.y = lerp(wp.groupY.start, wp.groupY.end, t);
  const envStart = TONE_ENV_START[wp.materialTone || 'dark'];
  monogram.material.envMapIntensity = lerp(envStart, wp.dimAtEnd, t);
}

/** Binds a scrubbed ScrollTrigger spanning the whole document for the active page. */
function bindScrollTrigger(pageKey) {
  if (pageScrollTrigger) pageScrollTrigger.kill();
  applyMaterialTone(pageKey); // page-level, not scroll-driven — set once per page, not per frame
  pageScrollTrigger = ScrollTriggerRef.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1, // slight lag for a cinematic, weighted feel — never a hard snap
    onUpdate: (self) => {
      if (transitionState || genericScrollSuspended) return; // another driver owns the camera right now
      applyPageWaypoint(pageKey, self.progress);
    },
  });
}

/**
 * Called by transitions.js right as a navigation begins. Tweens the camera
 * + monogram from the outgoing page's `end` state to the incoming page's
 * `start` state over `duration` seconds, then hands control back to a fresh
 * per-page ScrollTrigger for the new route.
 */
export function travelTo(nextPageKey, duration = 0.6) {
  if (!camera) return Promise.resolve();
  const fromWp = getWaypoint(currentPageKey);
  const toWp = getWaypoint(nextPageKey);

  const from = {
    pos: [...camera.position.toArray()],
    rot: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
    fov: camera.fov,
    // Every page's own dispersion arc returns to 0 at both ends (see
    // applyPageWaypoint) — the mark is always assembled at a page boundary.
    dispersion: 0,
    scale: monogram.group.scale.x,
    groupY: fromWp.groupY.end,
  };
  const to = {
    pos: toWp.camera.start.position,
    rot: toWp.camera.start.rotation,
    fov: toWp.camera.start.fov,
    dispersion: 0,
    scale: toWp.monogram.scaleStart,
    groupY: toWp.groupY.start,
  };

  const fromColor = monogram.material.color.clone();
  const toColor = new THREE.Color(TONE_COLORS[toWp.materialTone || 'dark']);

  transitionState = { from, to };
  currentPageKey = nextPageKey;

  return new Promise((resolve) => {
    const proxy = { t: 0 };
    gsapRef.to(proxy, {
      t: 1,
      duration,
      ease: 'power2.inOut', // matches the DOM diagonal wipe easing in transitions.js
      onUpdate: () => {
        camera.position.set(...lerp3(from.pos, to.pos, proxy.t));
        camera.rotation.set(...lerp3(from.rot, to.rot, proxy.t));
        camera.fov = lerp(from.fov, to.fov, proxy.t);
        camera.updateProjectionMatrix();
        camera.lookAt(0, 0, 0);
        applyDispersion(monogram.slabs, lerp(from.dispersion, to.dispersion, proxy.t));
        monogram.group.scale.setScalar(lerp(from.scale, to.scale, proxy.t));
        monogram.group.position.y = lerp(from.groupY, to.groupY, proxy.t);
        monogram.material.color.copy(fromColor).lerp(toColor, proxy.t);
      },
      onComplete: () => {
        transitionState = null;
        bindScrollTrigger(nextPageKey);
        resolve();
      },
    });
  });
}

function renderLoop() {
  rafId = requestAnimationFrame(renderLoop);
  if (!isVisible) return;

  const delta = clock.getDelta();

  // Ambient rotation: independent of scroll, always running, scaled per
  // waypoint so it recedes on content-dense pages instead of distracting.
  // Y-axis only, deliberately — the mark is a thin extruded slab (SLAB_DEPTH
  // 0.34 against a ~2.35 unit face), so tumbling it on X *and* Y used to spin
  // it edge-on to the camera at intervals, reading as an uncontrolled wobble
  // rather than a clean turntable rotation.
  const wp = getWaypoint(currentPageKey);
  monogram.group.rotation.y += wp.ambientRotationSpeed * delta;

  renderer.render(scene, camera);
}

export function startLoop() {
  if (rafId) return;
  clock.getDelta(); // discard the paused interval
  renderLoop();
}

export function stopLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/** Re-binds the per-page ScrollTrigger after a fake-SPA content swap changes document height. */
export function refreshForPage(pageKey) {
  currentPageKey = pageKey;
  ScrollTriggerRef.refresh();
  bindScrollTrigger(pageKey);
}

/**
 * Binds the Vision page's horizontal scroll-jacked growth path (Sourcing ->
 * Distribution -> Manufacturing -> International Trade).
 *
 * Deliberately NOT built on GSAP ScrollTrigger's `pin` — that relies on
 * ScrollTrigger computing and injecting its own spacer/position-fixed math
 * from window scroll state, which turned out to silently break inside the
 * Claude Artifact preview's embedding (stages 2-4 never appeared there,
 * despite this working in every direct-browser and Playwright test). This
 * version uses native CSS `position: sticky` for the pin (vision.css
 * `.horizon-pin`) — the browser's own layout engine keeps it correct
 * regardless of any embedding quirk — and drives the horizontal translate
 * + 3D morph from a plain `scroll` listener reading `wrapper`'s
 * getBoundingClientRect() each frame, with no ScrollTrigger involvement at
 * all. `wrapper` is `.horizon` (the tall scroll-distance container);
 * `track` is `.horizon-track` (the flex row of stage panels) sitting inside
 * the sticky `.horizon-pin`.
 */
export function bindVisionHorizontal(wrapper, track, onStageChange) {
  setGenericScrollSuspended(true);

  let extra = 0;
  const recalc = () => {
    extra = Math.max(track.scrollWidth - window.innerWidth, 0);
    wrapper.style.height = `calc(100svh + ${extra}px)`;
  };
  recalc();
  window.addEventListener('resize', recalc);

  let queued = false;
  const update = () => {
    queued = false;
    const rect = wrapper.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;

    gsapRef.set(track, { x: -progress * extra });

    const steps = VISION_STAGES.length - 1;
    const scaled = progress * steps;
    const idx = Math.min(Math.floor(scaled), steps - 1);
    const localT = scaled - idx;
    const a = VISION_STAGES[idx];
    const b = VISION_STAGES[idx + 1] || a;

    applyDispersion(monogram.slabs, lerp(a.dispersion, b.dispersion, localT));
    camera.position.z = lerp(a.cameraZ, b.cameraZ, localT);
    scrollRig.rotation.y = lerp(a.rotationY, b.rotationY, localT);
    camera.updateProjectionMatrix();

    onStageChange?.(Math.round(scaled));
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  update();

  return () => {
    window.removeEventListener('resize', recalc);
    window.removeEventListener('scroll', onScroll);
    wrapper.style.height = '';
    setGenericScrollSuspended(false);
    scrollRig.rotation.y = 0;
  };
}

export function isSceneActive() {
  return !!renderer;
}
