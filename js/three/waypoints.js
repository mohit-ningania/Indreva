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
 *     (the default rightward groupX bias, see scene.js, puts it there).
 *
 *   groupX (optional, default 2.4) / groupXKeys
 *     World-space X offset of the whole mark — almost every page leaves it
 *     at the default rightward bias, but a page whose own text runs all
 *     the way to that edge overrides it (a constant, or a groupXKeys
 *     keyframe array for a page that only needs the override part of its
 *     scroll — see contact below).
 *
 *   monogram.scaleEase / scaleDipKeys, groupY.dodgeKeys
 *     Optional per-page escape hatches for the one page-specific case the
 *     fields above can't express on their own: a fixed piece of that
 *     page's own text scrolling directly through the mark's otherwise-
 *     steady on-screen spot. scaleEase front-loads the scaleStart->scaleEnd
 *     shrink; scaleDipKeys/dodgeKeys are [t, value] keyframe arrays (see
 *     scene.js's sampleKeyframes) laid directly over that arc, solved
 *     point-by-point against the real rendered layout rather than guessed.
 *     See the home/contact entries below for two different shapes of this
 *     same problem.
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
    // against how much clear space sits around it in the hero. scaleEase
    // makes the shrink front-loaded (reaches scaleEnd well before t=1) so
    // it's already fairly small well before the end of the page.
    // Two trouble spots on this page have text passing directly through the
    // mark's otherwise-steady on-screen position (it barely moves on its
    // own — see scene.js applyPageWaypoint): the hero__actions button row
    // early on, and preview-grid's rightmost card (a 4-up row spanning the
    // full container, see home.css) further down. scaleDipKeys shrinks the
    // mark through each stretch and groupY.dodgeKeys nudges it the rest of
    // the way clear; both are keyframe arrays solved point-by-point against
    // the real rendered layout (sampled every 1% of scroll, verified to
    // clear both that content and the fixed header above it), not a
    // best-guess formula — see scene.js's sampleKeyframes/applyPageWaypoint
    // for how they're read. Neither touches home.css; both are 0/1 (no
    // effect) outside their own range.
    monogram: {
      peakDispersion: 0.12, scaleStart: 1.35, scaleEnd: 0.85, scaleEase: 7,
      scaleDipKeys: [
        [0, 1], [0.01, 0.87], [0.02, 0.74], [0.03, 0.61], [0.04, 0.48], [0.05, 0.35], [0.06, 0.22], [0.07, 0.22], [0.08, 0.22], [0.09, 0.22], [0.1, 0.22], [0.11, 0.22], [0.12, 0.22], [0.13, 0.22], [0.14, 0.22], [0.15, 0.22], [0.16, 0.22], [0.17, 0.22], [0.18, 0.22], [0.19, 0.22], [0.2, 0.22], [0.21, 0.22], [0.22, 0.22], [0.23, 0.22], [0.24, 0.22], [0.25, 0.35], [0.26, 0.48], [0.27, 0.61], [0.28, 0.74], [0.29, 0.87], [0.3, 1],
        [0.31, 0.883], [0.32, 0.767], [0.33, 0.65], [0.34, 0.533], [0.35, 0.417], [0.36, 0.3], [0.37, 0.3], [0.38, 0.3], [0.39, 0.3], [0.4, 0.3], [0.41, 0.3], [0.42, 0.3], [0.43, 0.3], [0.44, 0.3], [0.45, 0.3], [0.46, 0.3], [0.47, 0.3], [0.48, 0.3], [0.49, 0.3], [0.5, 0.3], [0.51, 0.3], [0.52, 0.3], [0.53, 0.3], [0.54, 0.3], [0.55, 0.3], [0.56, 0.3], [0.57, 0.3], [0.58, 0.3], [0.59, 0.3], [0.6, 0.3], [0.61, 0.417], [0.62, 0.533], [0.63, 0.65], [0.64, 0.767], [0.65, 0.883], [0.66, 1],
      ],
    },
    groupY: {
      start: 0, end: -0.4,
      dodgeKeys: [
        [0, 0], [0.01, 0], [0.02, 0], [0.03, 0], [0.04, 0], [0.05, 0], [0.06, 0], [0.07, 0], [0.08, 0], [0.09, 0], [0.1, 0], [0.11, 0], [0.12, 0.06], [0.13, 0.18], [0.14, 0.32], [0.15, -0.16], [0.16, -0.03], [0.17, 0], [0.18, 0], [0.19, 0], [0.2, 0], [0.21, 0], [0.22, 0], [0.23, 0], [0.24, 0], [0.25, 0], [0.26, 0], [0.27, 0], [0.28, 0], [0.29, 0], [0.3, 0],
        [0.31, 0], [0.32, 0], [0.33, 0], [0.34, 0], [0.35, 0], [0.36, 0], [0.37, 0], [0.38, 0.07], [0.39, 0.19], [0.4, 0.32], [0.41, 0.45], [0.42, 0.58], [0.43, 0.71], [0.44, 0.84], [0.45, 0.97], [0.46, 1.1], [0.47, 1.23], [0.48, -0.15], [0.49, -0.02], [0.5, 0], [0.51, 0], [0.52, 0], [0.53, 0], [0.54, 0], [0.55, 0], [0.56, 0], [0.57, 0], [0.58, 0], [0.59, 0], [0.6, 0], [0.61, 0], [0.62, 0], [0.63, 0], [0.64, 0], [0.65, 0], [0.66, 0],
      ],
    },
    ambientRotationSpeed: 0.09,
    dimAtEnd: 0.6,
  },
  about: {
    materialTone: 'dark',
    camera: {
      start: { position: [-1.4, 0.3, 3.4], rotation: [0, -0.3, 0], fov: 46 },
      end: { position: [0, -0.3, 4.5], rotation: [0, 0, 0], fov: 44 },
    },
    // Dispersed/scaled small AND pushed further right than the default 2.4:
    // this page's founders-grid/journey-steps content (about.css) runs
    // under the mark's resting spot for most of the page, with no clear
    // gap to duck into vertically — the only remaining room is mostly off
    // the right edge, so most of the mark sits there and only a slim
    // leading edge actually shows, rather than a full formation forcing
    // its way back over text.
    monogram: { peakDispersion: 0.18, scaleStart: 0.55, scaleEnd: 0.5 },
    groupX: 3.5,
    groupY: { start: 0, end: -0.4 },
    ambientRotationSpeed: 0.05,
    dimAtEnd: 0.55,
  },
  capabilities: {
    materialTone: 'dark',
    camera: {
      start: { position: [1.8, 0.4, 5.2], rotation: [0, 0.25, 0], fov: 44 },
      end: { position: [0, -0.3, 4.5], rotation: [0, 0, 0], fov: 44 },
    },
    // Smaller and less scattered than other pages, deliberately: this is the
    // one page whose 2-column layout alternates which side carries the text
    // (see capabilities.css), so on half its sections text runs all the way
    // into the right portion of the frame where the mark lives — its own
    // step-index numeral chapters, its "Put These Four Capabilities..."
    // CTA and the footer's address column too. Tiny scale plus a groupX
    // pushed well past the default 2.4 (mostly off the right edge, a slim
    // leading corner still visible) is what actually clears all of it.
    monogram: { peakDispersion: 0.1, scaleStart: 0.3, scaleEnd: 0.32 },
    groupX: 3.7,
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
    // Smaller/tighter than the hero pages, deliberately: Why Indreva's
    // positioning and values-grid sections span the full container width
    // (no reserved margin — content layout stays untouched), so the mark
    // needs both a tiny footprint and a groupX pushed well past the
    // default 2.4 (see capabilities above for the same pattern) to clear
    // its section-head, pull-quote and values-grid card text.
    monogram: { peakDispersion: 0.1, scaleStart: 0.3, scaleEnd: 0.32 },
    groupX: 4.5,
    groupY: { start: 0, end: -0.4 },
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
    // Start further back (8 vs. 6.5) and smaller/less scattered early on: a
    // fragment's flight path was clipping into the quote form's field
    // column in the first third of the page's scroll. Reassembly at t=1
    // (the "logo is made again" moment) is untouched — scaleEnd/end camera
    // z are unchanged, so it still locks in at full size over the footer.
    camera: {
      start: { position: [0, 0.3, 8.0], rotation: [0, 0, 0], fov: 44 },
      end: { position: [0, -0.2, 4.5], rotation: [0, 0, 0], fov: 42 },
    },
    // The quote form's field column (see contact.css .contact-grid) runs
    // almost the full viewport height for most of this page's scroll, with
    // the mark's default rightward bias sitting squarely inside it — no
    // vertical dodge fits since the column leaves no clear gap top-to-
    // bottom. groupX instead moves the mark into the grid's own gutter
    // between the two columns, with a stronger scaleDip so it's slim enough
    // to actually fit there instead of spilling into the text on either
    // side.
    // Slides back to the default 2.4 once the form's danger zone has fully
    // released (see monogram.scaleDipKeys below) — so the reassembled mark
    // still settles over the address column at the footer, not the nav
    // column, matching every other page's dock position.
    groupXKeys: [[-0.01, 0.45], [0.48, 0.45], [0.58, 2.4], [1.01, 2.4]],
    monogram: {
      peakDispersion: 0.28, scaleStart: 0.55, scaleEnd: 1.1,
      scaleDipKeys: [[-0.01, 0.14], [0.44, 0.14], [0.48, 1], [1.01, 1]],
    },
    groupY: { start: 0, end: -0.4 },
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
