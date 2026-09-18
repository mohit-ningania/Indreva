/**
 * ============================================================================
 * SCROLL WAYPOINTS — tune the 3D journey here.
 * ============================================================================
 * One entry per route. Each entry describes:
 *
 *   camera.start / camera.end
 *     Camera position [x,y,z], rotation (euler, radians) [x,y,z] and fov at
 *     the TOP and BOTTOM of that page's scroll range. scene.js scrubs
 *     linearly between them as the user scrolls the page (ScrollTrigger,
 *     scrub: 1). Values are in the shared world space the camera rig lives
 *     in — moving "through" the monogram means shrinking z toward/through 0.
 *
 *   monogram.dispersionStart / dispersionEnd
 *     0 = slabs form the assembled "iV". 1 = fully scattered fragments.
 *     Interpolated the same way as the camera, in lock-step with scroll.
 *
 *   monogram.scaleStart / scaleEnd
 *     Uniform scale of the whole mark across the page's scroll range.
 *
 *   ambientRotationSpeed
 *     Radians/second of the *independent* idle rotation layered on top of
 *     the scroll-driven transform (see scene.js renderLoop). Higher on
 *     Home where the mark is the hero; lower/zero on deep, content-dense
 *     pages so it doesn't compete with reading.
 *
 *   dimAtEnd
 *     0..1 opacity floor the material's envMapIntensity/emphasis fades
 *     toward by the end of the page — used to push the geometry back into
 *     ambient depth on the content-heavy middle pages.
 *
 *   materialTone
 *     'dark' (Deep Blue-Grey) or 'light' (Chrome Silver) — the monogram's
 *     material colour, set once per page (see scene.js applyMaterialTone).
 *     Every page is light-background/dark-logo except Vision, the site's
 *     one deep-dark chapter, which needs the light chrome tone to read
 *     against its dark backdrop.
 *
 * TRANSITION BETWEEN PAGES (see transitions.js + scene.js `travelTo`):
 * when navigating, the camera tweens from the CURRENT page's `camera.end`
 * to the NEXT page's `camera.start` over the transition duration, and
 * monogram dispersion tweens the same way — that's the "single continuous
 * path" the brief calls for, rather than independent per-page scenes.
 * ============================================================================
 */

export const WAYPOINTS = {
  home: {
    materialTone: 'dark',
    camera: {
      start: { position: [0, 0.1, 5.2], rotation: [0, 0, 0], fov: 42 },
      end: { position: [0, -0.4, 2.2], rotation: [0, 0.12, 0], fov: 48 },
    },
    // Bigger on load (1.35 vs. the old 1) — the mark was reading small
    // against how much clear space sits around it in the hero.
    monogram: { dispersionStart: 0, dispersionEnd: 0.35, scaleStart: 1.35, scaleEnd: 1.6 },
    ambientRotationSpeed: 0.09,
    dimAtEnd: 0.42,
  },
  about: {
    materialTone: 'dark',
    camera: {
      start: { position: [-1.4, 0.3, 3.4], rotation: [0, -0.3, 0], fov: 46 },
      end: { position: [1.6, -0.2, 4.6], rotation: [0, 0.28, 0], fov: 46 },
    },
    monogram: { dispersionStart: 0.35, dispersionEnd: 0.6, scaleStart: 1.1, scaleEnd: 0.95 },
    ambientRotationSpeed: 0.05,
    dimAtEnd: 0.28,
  },
  capabilities: {
    materialTone: 'dark',
    camera: {
      start: { position: [1.8, 0.4, 5.2], rotation: [0, 0.25, 0], fov: 44 },
      end: { position: [-2.1, -0.6, 6.4], rotation: [0, -0.22, 0], fov: 44 },
    },
    // "loose formation suggesting motion/routes" — held mid-dispersion
    monogram: { dispersionStart: 0.6, dispersionEnd: 0.68, scaleStart: 0.9, scaleEnd: 0.85 },
    ambientRotationSpeed: 0.04,
    dimAtEnd: 0.2,
  },
  'why-indreva': {
    materialTone: 'dark',
    camera: {
      start: { position: [-1.6, -0.3, 6.8], rotation: [0, -0.18, 0], fov: 44 },
      end: { position: [1.2, 0.5, 8.2], rotation: [0, 0.15, 0], fov: 44 },
    },
    monogram: { dispersionStart: 0.68, dispersionEnd: 0.78, scaleStart: 0.82, scaleEnd: 0.72 },
    ambientRotationSpeed: 0.03,
    dimAtEnd: 0.14,
  },
  vision: {
    materialTone: 'light',
    // Deepest page: geometry recedes to ambient depth, then the horizontal
    // scroll-jacked growth section (vision.js) morphs dispersion across its
    // four stages independently of this page-level start/end pair.
    camera: {
      start: { position: [0, 0.2, 9.5], rotation: [0, 0, 0], fov: 40 },
      end: { position: [0, -0.3, 5.5], rotation: [0, 0, 0], fov: 46 },
    },
    monogram: { dispersionStart: 0.78, dispersionEnd: 0.9, scaleStart: 0.7, scaleEnd: 1.0 },
    ambientRotationSpeed: 0.02,
    dimAtEnd: 0.18,
  },
  contact: {
    materialTone: 'dark',
    // Reassemble and lock into place.
    camera: {
      start: { position: [0, 0.3, 6.5], rotation: [0, 0, 0], fov: 44 },
      end: { position: [0, 0, 3.1], rotation: [0, 0, 0], fov: 42 },
    },
    monogram: { dispersionStart: 0.9, dispersionEnd: 0, scaleStart: 1.0, scaleEnd: 1.15 },
    ambientRotationSpeed: 0.06,
    dimAtEnd: 0.45,
  },
};

/** Vision page's own four-stage horizontal journey (sourcing -> ... -> international trade). */
export const VISION_STAGES = [
  { dispersion: 0.9, cameraZ: 5.5, rotationY: 0 },
  { dispersion: 0.55, cameraZ: 4.6, rotationY: 0.35 },
  { dispersion: 0.25, cameraZ: 3.8, rotationY: -0.3 },
  { dispersion: 0.05, cameraZ: 3.0, rotationY: 0.15 },
];

export function getWaypoint(pageKey) {
  return WAYPOINTS[pageKey] || WAYPOINTS.home;
}
