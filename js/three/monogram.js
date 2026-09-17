/**
 * Builds the "iV" monogram as extruded angular parallelogram slabs —
 * brushed-metal geometry, not text. Each slab carries userData describing
 * its ASSEMBLED (home-position) transform and a DISPERSAL vector/rotation
 * used by the scroll rig to separate/reassemble the mark. Tune the numbers
 * in SLAB_DEFS to reshape the mark or its break-apart motion.
 */
import * as THREE from '../vendor/three.module.min.js';

/**
 * A parallelogram shape (rectangle with sheared left/right edges) extruded
 * to a slab. `skew` shears the top edge relative to the bottom, giving the
 * angular "diagonal cut" look the brand calls for instead of plain blocks.
 */
function parallelogramGeometry(width, height, depth, skew) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 - skew, -height / 2);
  shape.lineTo(width / 2 - skew, -height / 2);
  shape.lineTo(width / 2 + skew, height / 2);
  shape.lineTo(-width / 2 + skew, height / 2);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geo.center();
  return geo;
}

/**
 * Slab definitions. position/rotation = the ASSEMBLED "iV" reading.
 * dispersal = unit-ish direction the slab drifts toward at full scatter,
 * plus the extra rotation it picks up along the way.
 * Edit these to reshape the mark — geometry math lives above, untouched.
 */
const SLAB_DEFS = [
  // "i" stem
  { key: 'i-stem', size: [0.34, 1.7, 0.32], skew: 0.05, position: [-1.05, -0.15, 0], rotation: [0, 0, 0.02], dispersal: { dir: [-2.6, 1.8, -1.4], rot: [0.4, 0.9, 0.2] } },
  // "i" dot
  { key: 'i-dot', size: [0.36, 0.36, 0.32], skew: 0.06, position: [-1.05, 1.15, 0], rotation: [0, 0, 0.02], dispersal: { dir: [-1.8, 3.1, 0.8], rot: [0.7, -0.6, 0.3] } },
  // "V" left stroke
  { key: 'v-left', size: [0.36, 1.9, 0.32], skew: -0.28, position: [0.15, -0.05, 0], rotation: [0, 0, 0.34], dispersal: { dir: [1.1, 2.2, 1.6], rot: [-0.5, 0.4, -0.3] } },
  // "V" right stroke
  { key: 'v-right', size: [0.36, 1.9, 0.32], skew: 0.28, position: [1.05, -0.05, 0], rotation: [0, 0, -0.34], dispersal: { dir: [2.8, 1.6, -1.1], rot: [0.3, -0.7, 0.5] } },
  // Two small accent fragments — pure motif, thicken the "route lines" formation mid-site
  { key: 'fragment-a', size: [0.5, 0.2, 0.3], skew: 0.18, position: [1.9, 0.9, -0.3], rotation: [0, 0, 0.5], dispersal: { dir: [3.4, -2.1, 2.2], rot: [0.9, 0.2, 0.6] } },
  { key: 'fragment-b', size: [0.44, 0.18, 0.3], skew: -0.16, position: [-2.0, -1.0, 0.3], rotation: [0, 0, -0.42], dispersal: { dir: [-3.1, -2.4, -1.8], rot: [-0.6, 0.8, -0.4] } },
];

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
    const geo = parallelogramGeometry(def.size[0], def.size[1], def.size[2], def.skew);
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = def.key;
    mesh.position.set(...def.position);
    mesh.rotation.set(...def.rotation);
    mesh.userData.assembledPosition = def.position;
    mesh.userData.assembledRotation = def.rotation;
    mesh.userData.dispersalDir = def.dispersal.dir;
    mesh.userData.dispersalRot = def.dispersal.rot;
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
