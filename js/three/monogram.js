/**
 * Builds the Indreva monogram as extruded angular slabs — brushed-metal
 * geometry, not text. Each slab's 2D outline is copied point-for-point from
 * the brand identity PDF's own icon construction (flag, stem, and two
 * converging strokes), in the same 0-104 coordinate space as
 * assets/favicons/mark.svg, so the 3D mark and the flat logo always agree.
 * Each slab also carries userData describing its ASSEMBLED (home-position)
 * transform and a DISPERSAL vector/rotation used by the scroll rig to
 * separate/reassemble the mark.
 */
import * as THREE from '../vendor/three.module.min.js?v=17';

// Same coordinate space as assets/favicons/mark.svg (viewBox 0 0 104 104).
// Edit these points to reshape the mark — keep favicon/wordmark SVGs in sync.
const MARK_SPACE = 104;
const BRAND_SLABS = [
  { key: 'flag', points: [[41.8, 30.5], [56.1, 30.5], [52.5, 35.3], [38.4, 35.3]] },
  { key: 'stem', points: [[37.5, 37.9], [54.1, 37.9], [28.3, 73.6], [11.7, 73.6]] },
  { key: 'stroke-left', points: [[55.1, 37.9], [75.0, 37.9], [52.5, 73.6], [51.2, 73.6]] },
  { key: 'stroke-right', points: [[77.3, 37.9], [92.7, 37.9], [70.5, 73.6], [53.8, 73.6]] },
];

/** World-space scale for the whole mark; MARK_SPACE units map to this many Three.js units tall. */
const WORLD_SCALE = 2.35 / 90;

/**
 * Converts one slab's raw brand-space points into: (a) a flat 2D outline
 * already centered on its own bounding-box, ready to extrude, and (b) the
 * assembled world-space position that recovers the original layout once
 * that centered geometry is placed there. Keeps the extrusion math generic
 * (any polygon) instead of assuming a symmetric parallelogram.
 */
function localizeSlab(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  // Brand-space is y-down (SVG); Three.js world is y-up — flip on the way in.
  const local = points.map(([x, y]) => [(x - cx) * WORLD_SCALE, -(y - cy) * WORLD_SCALE]);
  const markCenter = MARK_SPACE / 2;
  const worldPosition = [(cx - markCenter) * WORLD_SCALE, -(cy - markCenter) * WORLD_SCALE, 0];
  return { local, worldPosition };
}

// Corner radius in brand-space units — matches the R=2.4 used to build the
// flat SVG paths (assets/favicons/mark.svg), so the extruded slabs and the
// flat logo read as the same rounded-corner shape at any scale.
const CORNER_RADIUS = 2.4 * WORLD_SCALE;

/**
 * Same rounded-corner construction as the SVG paths: at each vertex, walk
 * back `radius` along the incoming edge and forward `radius` along the
 * outgoing edge, then join those two points with a quadratic curve whose
 * control point is the original (sharp) vertex. Radius is clamped per
 * corner so it never exceeds ~45% of either adjacent edge — the stem is
 * narrow enough that an unclamped radius would self-intersect.
 */
function polygonGeometry(localPoints, depth, radius = CORNER_RADIUS) {
  const shape = new THREE.Shape();
  const n = localPoints.length;

  const cornerPoints = (i) => {
    const prev = localPoints[(i - 1 + n) % n];
    const cur = localPoints[i];
    const next = localPoints[(i + 1) % n];
    const d1x = cur[0] - prev[0], d1y = cur[1] - prev[1];
    const len1 = Math.hypot(d1x, d1y);
    const d2x = next[0] - cur[0], d2y = next[1] - cur[1];
    const len2 = Math.hypot(d2x, d2y);
    const r = Math.min(radius, len1 * 0.45, len2 * 0.45);
    return {
      cur,
      p1: [cur[0] - (d1x / len1) * r, cur[1] - (d1y / len1) * r],
      p2: [cur[0] + (d2x / len2) * r, cur[1] + (d2y / len2) * r],
    };
  };

  const first = cornerPoints(0);
  shape.moveTo(first.p1[0], first.p1[1]);
  for (let i = 0; i < n; i++) {
    const c = cornerPoints(i);
    shape.quadraticCurveTo(c.cur[0], c.cur[1], c.p2[0], c.p2[1]);
    if (i < n - 1) {
      const next = cornerPoints(i + 1);
      shape.lineTo(next.p1[0], next.p1[1]);
    }
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 6,
  });
  geo.center(); // centers Z (depth); X/Y are already centered by localizeSlab
  return geo;
}

const SLAB_DEPTH = 0.34;

/**
 * Slab definitions: exact brand geometry (position below) plus the
 * DISPERSAL vector/rotation each slab drifts toward at full scatter.
 * Edit dispersal values to reshape the break-apart motion — the assembled
 * reading itself is locked to BRAND_SLABS above.
 */
const SLAB_DEFS = BRAND_SLABS.map((def) => {
  const { local, worldPosition } = localizeSlab(def.points);
  return { ...def, local, position: worldPosition };
});

// A big, organic break-apart on all three axes. Two fragments drift hard
// left, two drift hard right, so at full scatter the mark reads as spread
// across the whole viewport rather than huddled in one spot — the x
// magnitudes here are deliberately large (previously kept tiny to avoid
// pushing fragments past the right edge, which just made the break-apart
// look cramped). Edge safety instead comes from scene.js/waypoints.js:
// each page's peakDispersion and groupX are tuned so this full spread stays
// on-screen at rest it never runs — dispersion is 0 whenever the mark is
// assembled, so this only ever applies mid-scroll.
// Left/right reach is deliberately asymmetric: every page biases the
// assembled mark's rest position toward the right already (to clear its own
// text there), so adding a large *rightward* scatter on top of that risks
// running past the right edge. The left side has the room instead — this is
// also the side that carries the mark across into the page's own reading
// column during the break-apart, which is what "spans the whole screen"
// means in practice, not a symmetric spread around an already-right-biased
// centre.
// Rotation and depth (y/z) magnitudes bumped up further — per feedback the
// break-apart read as too tame — for a more emphatic, tumbling scatter; x
// (screen-width reach) is untouched since that's independently tuned for
// edge safety per page.
const DISPERSAL = {
  flag: { dir: [1.6, 1.8, -1.6], rot: [0.85, -0.7, 0.35] },
  stem: { dir: [-4.0, -1.7, -1.8], rot: [0.5, 0.95, 0.25] },
  'stroke-left': { dir: [1.4, 1.4, 1.6], rot: [-0.6, 0.5, -0.35] },
  'stroke-right': { dir: [-3.6, -1.4, 1.3], rot: [0.35, -0.85, 0.6] },
};

function buildEnvironment(renderer) {
  // Procedural gradient "studio" environment (no external HDR fetch) so the
  // brushed-metal material still gets soft reflections/highlights to read
  // as machined metal rather than a flat-shaded block. Kept mostly dark/
  // mid-tone on purpose: at metalness ~0.8 the environment reflection
  // dominates the material's apparent brightness far more than its base
  // colour does, so a bright chrome-style env map would wash the dark
  // Deep Blue-Grey tone out to near-white — this stays dark with only a
  // narrow bright band and a narrow ice-blue band for a gunmetal read.
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#1c2126');
  grad.addColorStop(0.4, '#2e3a46');
  grad.addColorStop(0.58, '#8a929b');
  grad.addColorStop(0.68, '#a9c6da');
  grad.addColorStop(1, '#1c2126');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(texture).texture;
  texture.dispose();
  pmrem.dispose();
  return envMap;
}

export function createMonogram(renderer) {
  const group = new THREE.Group();
  group.name = 'monogram';

  const envMap = buildEnvironment(renderer);

  // Metalness/roughness nudged up slightly (was 0.7/0.46) for a crisper,
  // more premium reflection — per owner request for a "premium" read on the
  // home hero mark — while staying short of a full mirror-chrome look so the
  // dark base colour still dominates over the reflection (see the dim/narrow
  // env map above, built specifically to counter that at high metalness).
  const material = new THREE.MeshStandardMaterial({
    color: 0x2e3a46,       // Deep Blue-Grey — dark metal, the default on the site's light pages
    metalness: 0.74,
    roughness: 0.38,
    envMap,
    envMapIntensity: 0.65,
  });

  const slabs = SLAB_DEFS.map((def) => {
    // The 2D outline already carries the correct tilt/skew from the brand
    // mark, so the assembled rotation is always identity — only dispersal
    // adds rotation, as the slab flies apart.
    const geo = polygonGeometry(def.local, SLAB_DEPTH);
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = def.key;
    mesh.position.set(...def.position);
    mesh.userData.assembledPosition = def.position;
    mesh.userData.assembledRotation = [0, 0, 0];
    mesh.userData.dispersalDir = DISPERSAL[def.key].dir;
    mesh.userData.dispersalRot = DISPERSAL[def.key].rot;
    group.add(mesh);
    return mesh;
  });

  return { group, slabs, material, envMap };
}

/**
 * dispersion: 0 = fully assembled "iV", 1 = fully scattered fragments.
 * Called every frame with the current scroll-driven dispersion value —
 * cheap linear interpolation per slab, no easing here (the caller already
 * eased the scalar via ScrollTrigger scrub / GSAP tween).
 */
// Fragments shrink as they scatter — reads as receding into depth rather
// than fixed-size debris just floating apart. Lowered further (was 0.72) as
// part of making the whole break-apart more emphatic.
const DISPERSED_SCALE_FLOOR = 0.56;

// scaleCompensation counters the outer group's own scale (see scene.js —
// several pages shrink the assembled mark to clear their hero text) so the
// break-apart's actual on-screen reach stays consistent everywhere. Without
// it, a page tuned to a small assembled scale also got a proportionally
// tiny, cramped-looking scatter, since group.scale multiplies every child's
// local position — including this dispersal offset.
export function applyDispersion(slabs, dispersion, scaleCompensation = 1) {
  slabs.forEach((mesh) => {
    const [px, py, pz] = mesh.userData.assembledPosition;
    const [dx, dy, dz] = mesh.userData.dispersalDir;
    const [rx, ry, rz] = mesh.userData.dispersalRot;
    const [arx, ary, arz] = mesh.userData.assembledRotation;
    const spread = dispersion * scaleCompensation;

    mesh.position.set(px + dx * spread, py + dy * spread, pz + dz * spread);
    mesh.rotation.set(arx + rx * dispersion, ary + ry * dispersion, arz + rz * dispersion);
    mesh.scale.setScalar(1 - (1 - DISPERSED_SCALE_FLOOR) * dispersion);
  });
}
