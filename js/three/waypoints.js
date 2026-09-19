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
 *   monogram.peakDispersion
 *     0 = slabs form the assembled "iV". 1 = fully scattered fragments. The
 *     mark is always assembled (0) at t=0 and t=1 — dispersion follows a
 *     sine arc across the page's own scroll, peaking at this value around
 *     the page's midpoint (see scene.js applyPageWaypoint). Every page
 *     reads "assembled -> breaks apart -> reassembles" rather than a
 *     one-way scatter that only recombines on Contact.
 *
 *   monogram.scaleStart / scaleEnd
 *     Uniform scale of the whole mark across the page's scroll range.
 *
 *   groupY.start / groupY.end
 *     World-space Y offset of the whole mark at the top/bottom of the
 *     page's scroll range. By t=1 this sinks the reassembled mark down
 *     toward the footer boundary — the canvas itself never clips anything;
 *     the footer's own opaque background sits at a higher z-index (see
 *     layout.css) and naturally covers the mark's lower half, reading as
 *     "half tucked behind the footer" above the address column on the right
 *     (group.position.x's fixed rightward bias, see scene.js, puts it there).
 *
 *   ambientRotationSpeed
 *     Radians/second of the *independent* idle rotation layered on top of
 *     the scroll-driven transform (see scene.js renderLoop). Higher on
 *     Home where the mark is the hero; lower/zero on deep, content-dense
 *     pages so it doesn't compete with reading.
 *
 *   dimAtEnd
 *     0..1 opacity floor the material's envMapIntensity/emphasis fades
 *     toward by the end of the page. Kept fairly bright everywhere now that
 *     every page ends reassembled and sitting prominently over the footer,
 *     rather than dimmed into ambient depth as a permanently-scattered mark.
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
 * to the NEXT page's `camera.start` over the transition duration; dispersion
 * stays at 0 throughout (both pages are assembled at their boundaries) and
 * groupY tweens from the outgoing page's sunk position back to the incoming
 * page's resting position — that's the "single continuous path" the brief
 * calls for, rather than independent per-page scenes.
 * ============================================================================
 */

export const WAYPOINTS = {
  home: {
    materialTone: 'dark',
    camera: {
      start: { position: [0, 0.1, 5.2], rotation: [0, 0, 0], fov: 42 },
      end: { position: [0, -0.3, 4.5], rotation: [0, 0, 0], fov: 44 },
    },
    // Bigger on load (1.35 vs. the old 1) — the mark was reading small
    // against how much clear space sits around it in the hero.
    monogram: { peakDispersion: 0.35, scaleStart: 1.35, scaleEnd: 1.1 },
    groupY: { start: 0, end: -0.1 },
    ambientRotationSpeed: 0.09,
    dimAtEnd: 0.6,
  },
  about: {
    materialTone: 'dark',
    camera: {
      start: { position: [-1.4, 0.3, 3.4], rotation: [0, -0.3, 0], fov: 46 },
      end: { position: [0, -0.3, 4.5], rotation: [0, 0, 0], fov: 44 },
    },
    monogram: { peakDispersion: 0.55, scaleStart: 1.1, scaleEnd: 1.05 },
    groupY: { start: 0, end: -0.1 },
    ambientRotationSpeed: 0.05,
    dimAtEnd: 0.55,
  },
  capabilities: {
    materialTone: 'dark',
    camera: {
      start: { position: [1.8, 0.4, 5.2], rotation: [0, 0.25, 0], fov: 44 },
      end: { position: [0, -0.3, 4.5], rotation: [0, 0, 0], fov: 44 },
    },
    // "loose formation suggesting motion/routes" mid-page, reassembled by the footer.
    monogram: { peakDispersion: 0.6, scaleStart: 0.9, scaleEnd: 1.05 },
    groupY: { start: 0, end: -0.1 },
    ambientRotationSpeed: 0.04,
    dimAtEnd: 0.5,
  },
  'why-indreva': {
    materialTone: 'dark',
    camera: {
      start: { position: [-1.6, -0.3, 6.8], rotation: [0, -0.18, 0], fov: 44 },
      end: { position: [0, -0.3, 4.5], rotation: [0, 0, 0], fov: 44 },
    },
    monogram: { peakDispersion: 0.68, scaleStart: 0.82, scaleEnd: 1.05 },
    groupY: { start: 0, end: -0.1 },
    ambientRotationSpeed: 0.03,
    dimAtEnd: 0.5,
  },
  vision: {
    materialTone: 'light',
    // Deepest page: geometry recedes to ambient depth, then the horizontal
    // scroll-jacked growth section (vision.js) morphs dispersion across its
    // four stages independently of this page-level start/end pair — this
    // page's own generic ScrollTrigger stays suspended for as long as that
    // section owns the camera (see scene.js setGenericScrollSuspended).
    camera: {
      start: { position: [0, 0.2, 9.5], rotation: [0, 0, 0], fov: 40 },
      end: { position: [0, -0.3, 5.5], rotation: [0, 0, 0], fov: 46 },
    },
    monogram: { peakDispersion: 0.3, scaleStart: 0.7, scaleEnd: 1.0 },
    groupY: { start: 0, end: 0 },
    ambientRotationSpeed: 0.02,
    dimAtEnd: 0.5,
  },
  contact: {
    materialTone: 'dark',
    // Reassemble and lock into place — the moment the mark settles over the
    // footer, right above the address block.
    camera: {
      start: { position: [0, 0.3, 6.5], rotation: [0, 0, 0], fov: 44 },
      end: { position: [0, -0.2, 4.5], rotation: [0, 0, 0], fov: 42 },
    },
    monogram: { peakDispersion: 0.5, scaleStart: 1.0, scaleEnd: 1.1 },
    groupY: { start: 0, end: -0.1 },
    ambientRotationSpeed: 0.06,
    dimAtEnd: 0.6,
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
