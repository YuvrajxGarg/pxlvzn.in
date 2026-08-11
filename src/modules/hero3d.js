// hero: the wordmark PXLVZN built from ~2k instanced voxels.
// voxels breathe on a wave and flee the cursor. three.js, one draw call.
import * as THREE from 'three';

const WORD = 'PXLVZN';
const VOLT = new THREE.Color('#c8ff00');
const MAG = new THREE.Color('#ff3df5');
const CYAN = new THREE.Color('#24e0ff');
const GREY = new THREE.Color('#2a2a2a');

function sampleWord() {
  // rasterize the word tiny, read back filled cells
  const c = document.createElement('canvas');
  const scale = 4;
  c.width = 220; c.height = 48;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.font = '700 40px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(WORD, c.width / 2, 26);
  const img = ctx.getImageData(0, 0, c.width, c.height).data;
  const cells = [];
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (img[(y * c.width + x) * 4 + 3] > 128) {
        cells.push([x - c.width / 2, -(y - c.height / 2)]);
      }
    }
  }
  return { cells, scale };
}

export async function initHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  // the wordmark is rasterized from the webfont — wait for it
  try { await document.fonts.ready; } catch { /* sample with fallback font */ }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x060606, 90, 260);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);
  camera.position.set(0, 4, 130);

  const { cells } = sampleWord();
  const count = cells.length;
  const halfWidth = cells.reduce((m, [x]) => Math.max(m, Math.abs(x)), 0);

  const geo = new THREE.BoxGeometry(0.92, 0.92, 0.92);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.15 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const dummy = new THREE.Object3D();
  const base = new Float32Array(count * 3);
  const jitter = new Float32Array(count * 2);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const [x, y] = cells[i];
    base[i * 3] = x * 1.0;
    base[i * 3 + 1] = y * 1.0;
    base[i * 3 + 2] = 0;
    jitter[i * 2] = Math.random() * Math.PI * 2;
    jitter[i * 2 + 1] = 0.5 + Math.random();

    // mostly grey, a sparse scattering of brand colors
    const r = Math.random();
    color.copy(r > 0.975 ? VOLT : r > 0.955 ? MAG : r > 0.935 ? CYAN : GREY);
    mesh.setColorAt(i, color);
  }
  mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(30, 40, 60);
  scene.add(key);
  const rim = new THREE.PointLight(VOLT, 900, 300);
  rim.position.set(-60, -20, 40);
  scene.add(rim);

  // pointer in world space (approx, at z=0 plane)
  const pointer = new THREE.Vector2(9999, 9999);
  const target = new THREE.Vector2(9999, 9999);
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();

  window.addEventListener('pointermove', (e) => {
    const ndc = new THREE.Vector2(
      (e.clientX / innerWidth) * 2 - 1,
      -(e.clientY / innerHeight) * 2 + 1
    );
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) target.set(hit.x, hit.y);
  });

  function resize() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // dolly back until the word fits the viewport width, fog follows the camera
    const fitZ = (halfWidth + 12) / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camera.position.z = Math.max(fitZ * 1.08, 95);
    scene.fog.near = camera.position.z - 50;
    scene.fog.far = camera.position.z + 140;
    // park the word's center at ~38% viewport height, clear of the copy below
    const visibleH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    mesh.position.y = visibleH * 0.12 + camera.position.y;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let scrollFade = 1;
  window.addEventListener('scroll', () => {
    scrollFade = Math.max(0, 1 - scrollY / innerHeight);
  }, { passive: true });

  function frame() {
    requestAnimationFrame(frame);
    if (scrollFade <= 0) return; // hero off-screen: skip work entirely

    const t = clock.getElapsedTime();
    pointer.lerp(target, 0.12);
    const py = pointer.y - mesh.position.y; // pointer in mesh-local space

    for (let i = 0; i < count; i++) {
      const bx = base[i * 3], by = base[i * 3 + 1];
      const ph = jitter[i * 2], amp = jitter[i * 2 + 1];

      // idle breathing wave along x
      let z = Math.sin(t * 1.4 + bx * 0.12 + ph) * 1.6 * amp;

      // cursor repulsion
      const dx = bx - pointer.x, dy = by - py;
      const d2 = dx * dx + dy * dy;
      const R = 18;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 0.001;
        const f = (1 - d / R) ** 2 * 14;
        z += f * 1.8;
        dummy.position.set(bx + (dx / d) * f * 0.6, by + (dy / d) * f * 0.6, z);
        dummy.rotation.set(f * 0.15, f * 0.1, 0);
        const s = 1 + f * 0.06;
        dummy.scale.setScalar(s);
      } else {
        dummy.position.set(bx, by, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    mesh.rotation.y = Math.sin(t * 0.25) * 0.07;
    mesh.rotation.x = Math.cos(t * 0.2) * 0.04;
    renderer.render(scene, camera);
  }
  frame();
}
