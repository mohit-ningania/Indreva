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
import * as THREE from '../vendor/three.module.min.js';

// Same coordinate space as assets/favicons/mark.svg (viewBox 0 0 104 104).
// Edit these points to reshape the mark — keep favicon/wordmark SVGs in sync.
const MARK_SPACE = 104;
const BRAND_SLABS = [
  { key: 'flag', points: [[13, 10], [32, 8], [26, 18], [7, 20]] },
  { key: 'stem', points: [[11, 27], [21, 25], [14, 96], [4, 98]] },
  { key: 'stroke-left', points: [[37, 19], [53, 19], [65, 92], [49, 92]] },
  { key: 'stroke-right', points: [[99, 19], [83, 19], [65, 92], [81, 92]] },
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

function polygonGeometry(localPoints, depth) {
  const shape = new THREE.Shape();
  localPoints.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 1,
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

const DISPERSAL = {
  flag: { dir: [-1.8, 3.1, 0.8], rot: [0.7, -0.6, 0.3] },
  stem: { dir: [-2.6, 1.8, -1.4], rot: [0.4, 0.9, 0.2] },
  'stroke-left': { dir: [1.1, 2.2, 1.6], rot: [-0.5, 0.4, -0.3] },
  'stroke-right': { dir: [2.8, 1.6, -1.1], rot: [0.3, -0.7, 0.5] },
};

function buildEnvironment(renderer) {
  // Procedural gradient "studio" environment (no external HDR fetch) so the
  // brushed-metal material still gets soft reflections/highlights to read
  // as machined metal rather than a flat-shaded block.
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#3a4956');
  grad.addColorStop(0.45, '#b8bcc2');
  grad.addColorStop(0.62, '#a9c6da');
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

  const material = new THREE.MeshStandardMaterial({
    color: 0xb8bcc2,       // Chrome Silver base
    metalness: 0.88,
    roughness: 0.32,
    envMap,
    envMapIntensity: 1.1,
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
export function applyDispersion(slabs, dispersion) {
  slabs.forEach((mesh) => {
    const [px, py, pz] = mesh.userData.assembledPosition;
    const [dx, dy, dz] = mesh.userData.dispersalDir;
    const [rx, ry, rz] = mesh.userData.dispersalRot;
    const [arx, ary, arz] = mesh.userData.assembledRotation;

    mesh.position.set(px + dx * dispersion, py + dy * dispersion, pz + dz * dispersion);
    mesh.rotation.set(arx + rx * dispersion, ary + ry * dispersion, arz + rz * dispersion);
  });
}
