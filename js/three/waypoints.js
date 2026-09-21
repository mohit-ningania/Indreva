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
 *     "half tucked behind the footer" above the address column on the right.
 *
 *   groupX.start / groupX.end
 *     World-space X offset of the whole mark, same start/end scrub as
 *     everything else here. Optional — a page that omits it falls back to
 *     scene.js's DEFAULT_GROUP_X. Tuned per page (together with
 *     monogram.scaleStart/scaleEnd) so the mark's own bounding box clears
 *     that page's hero/rest-state text at t=0 and t=1 specifically — the two
 *     moments a visitor actually stops scrolling and can scrutinize exact
 *     alignment. scene.js also fades the material toward a translucent
 *     TRANSIT_OPACITY away from those two rest states, since a page's own
 *     body copy (headings, cards) isn't something this rig can see or dodge
 *     mid-scroll — the fade is what keeps an incidental pass-behind reading
 *     as "soft background element," not "logo colliding with a heading."
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
 *
 * SCROLL-DRIVEN ANIMATION REMOVED (see scene.js module header): the mark is
 * now set once to each page's `start`/`scaleStart`/`groupY.start`/
 * `groupX.start` and held static while the page scrolls underneath it. Every
 * `.end` value, `peakDispersion`, and `reassembleAt` below is currently
 * inert — kept as-is (rather than stripped) so the earlier "assemble ->
 * break apart -> reassemble" tuning isn't lost if that motion is ever
 * reinstated. `camera.end` is still live for one thing: `travelTo` (scene.js)
 * still tweens between pages, and the incoming page's `camera.start` /
 * `monogram.scaleStart` / `groupY.start` / `groupX.start` are its landing
 * values there.
 * ============================================================================
 */

export const WAYPOINTS = {
  home: {
    materialTone: 'dark',
    camera: {
      start: { position: [0, 0.1, 5.2], rotation: [0, 0, 0], fov: 42 },
      end: { position: [0, -0.3, 4.5], rotation: [0, 0, 0], fov: 44 },
    },
    // Scale halved from an earlier 1.35/1.1 and groupX pushed out —
    // measured against the hero title's actual rendered text (not its
    // containing element, which can be wider than the glyphs) at 1440px:
    // the old size/position had the assembled mark sitting directly over
    // "Opportunities." at t=0. Bumped back up ~15% and shifted further
    // right afterward (per owner feedback the mark read too small/central)
    // — re-verified against the same hero text and edge-safe down to 1024px.
    monogram: { peakDispersion: 0.35, scaleStart: 0.776, scaleEnd: 0.6325 },
    groupY: { start: 0, end: -0.4 },
    groupX: { start: 1.7, end: 1.7 },
    ambientRotationSpeed: 0.09,
    dimAtEnd: 0.6,
  },
  about: {
    materialTone: 'dark',
    // start.position.z pulled back from 3.4 to 4.5 to match every other
    // page's starting distance — that close, combined with this page's own
    // off-axis start angle, was enough on its own to push the assembled
    // mark's right edge past the viewport before any scroll or dispersion.
    camera: {
      start: { position: [-1.4, 0.3, 4.5], rotation: [0, -0.3, 0], fov: 46 },
      end: { position: [0, -0.3, 4.5], rotation: [0, 0, 0], fov: 44 },
    },
    // Scale halved and groupX pushed to 1.9 — clears the "Built By Two
    // Founders..." hero title at t=0/t=1, measured against actual glyphs.
    // reassembleAt: the mark comes fully together right as the "Mohit /
    // Sahil" founder cards scroll into view, instead of being at its most
    // scattered there — the two-founders section getting a visibly whole
    // mark, not a random scatter of fragments, is the point.
    monogram: { peakDispersion: 0.55, scaleStart: 0.55, scaleEnd: 0.525, reassembleAt: 0.5 },
    groupY: { start: 0, end: -0.4 },
    groupX: { start: 1.4, end: 1.4 },
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
    groupY: { start: 0, end: -0.4 },
    ambientRotationSpeed: 0.04,
    dimAtEnd: 0.5,
  },
  'why-indreva': {
    materialTone: 'dark',
    camera: {
      start: { position: [-1.6, -0.3, 6.8], rotation: [0, -0.18, 0], fov: 44 },
      end: { position: [0, -0.3, 4.5], rotation: [0, 0, 0], fov: 44 },
    },
    // Scale halved — clears the "Globally Capable..." hero title at t=0/t=1.
    monogram: { peakDispersion: 0.68, scaleStart: 0.41, scaleEnd: 0.525 },
    groupY: { start: 0, end: -0.4 },
    groupX: { start: 1.0, end: 1.0 },
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
    // end matches VISION_STAGES' own final stage (cameraZ 3.0, rotationY
    // 0.15) — scene.js hands the camera back to this page-level waypoint
    // right around the moment the horizontal section's own scroll ends, so
    // matching its last framing here keeps that handoff from snapping.
    camera: {
      start: { position: [0, 0.2, 9.5], rotation: [0, 0, 0], fov: 40 },
      end: { position: [0, -0.3, 3.0], rotation: [0, 0.15, 0], fov: 46 },
    },
    // scaleStart/groupX.start/groupY.start clear the hero title (three
    // stacked lines spanning most of the frame) — bumped up twice now
    // (0.63/2.2 -> 0.9/2.6 -> this) per feedback the mark should fill more
    // of the page. Pushed further right and up (groupY.start now positive,
    // was 0) rather than just scaled in place, since the page has generous
    // clear space to the right of the title and above the lede paragraph
    // but comparatively little to the left (the title) or below (the lede)
    // — growing straight into those tight sides would have collided with
    // them well before the mark could read as meaningfully bigger. Verified
    // against the title/lede's actual rendered text (not their containing
    // elements) with clearance at 1024/1280/1440/1920px; scaleEnd is
    // unaffected (still much smaller than a typical page's, and groupX.end
    // still pulls back toward centre) because camera.end sits at z=3 — far
    // closer than other pages' ~4.5 — so the same scale/offset that reads
    // fine at rest would blow up oversized in that close-up framing.
    monogram: { peakDispersion: 0.3, scaleStart: 1.2, scaleEnd: 0.36 },
    groupY: { start: 0.28, end: 0 },
    groupX: { start: 3.2, end: 0.7 },
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
    // Scale halved and groupX pushed to 1.6 — this page's form fields sit
    // directly below a short hero with almost no scroll runway between them,
    // so at the old size the mark landed on the "Name"/"Email" labels at
    // t=0 regardless of horizontal position.
    monogram: { peakDispersion: 0.5, scaleStart: 0.5, scaleEnd: 0.55 },
    groupY: { start: 0, end: -0.4 },
    groupX: { start: 1.6, end: 1.6 },
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
