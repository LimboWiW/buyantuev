import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const root = document.querySelector('.scene');
const canvas = document.getElementById('threeCanvas');
if (!root || !canvas || !window.getCabinetState) throw new Error('3D editor mount is missing');

const scene = new THREE.Scene();
const isMobile = matchMedia('(max-width: 760px)').matches || /Mobi|Android/i.test(navigator.userAgent);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.7));
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
const target = new THREE.Vector3(0, 1.15, 0);
const cabinetGroup = new THREE.Group();
scene.add(cabinetGroup);

const ambient = new THREE.HemisphereLight(0xfff8e9, 0x5c6870, 2.2);
scene.add(ambient);
const key = new THREE.DirectionalLight(0xffe0b3, 3.2);
key.position.set(3.4, 5.5, 4.5);
key.castShadow = !isMobile;
key.shadow.mapSize.set(isMobile ? 512 : 1024, isMobile ? 512 : 1024);
scene.add(key);
const fill = new THREE.DirectionalLight(0xcfe3ff, 1.25);
fill.position.set(-4, 2.4, 2);
scene.add(fill);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ color: 0x2f241d, opacity: .2 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -.012;
ground.receiveShadow = true;
scene.add(ground);

let yaw = 0;
let pitch = 0.08;
let zoom = 1;
let drag = null;
let lastSignature = '';
let fitDistance = 6.2;

function cssColor(name, fallback) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
function mat(color, roughness = .46, metalness = 0) { return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }
function box(w, h, d, material, x, y, z, parent = cabinetGroup) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function roundedBox(w, h, d, material, x, y, z, radius = .02) {
  const shape = new THREE.Shape();
  const r = Math.min(radius, w / 3, h / 3);
  shape.moveTo(-w / 2 + r, -h / 2); shape.lineTo(w / 2 - r, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); shape.lineTo(w / 2, h / 2 - r); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); shape.lineTo(-w / 2 + r, h / 2); shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); shape.lineTo(-w / 2, -h / 2 + r); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSegments: isMobile ? 1 : 2, bevelSize: .008, bevelThickness: .008 });
  geo.center();
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  cabinetGroup.add(mesh);
  return mesh;
}
function clearGroup() { while (cabinetGroup.children.length) { const child = cabinetGroup.children.pop(); child.geometry?.dispose(); if (Array.isArray(child.material)) child.material.forEach(m => m.dispose()); else child.material?.dispose(); } }
function getState() { return window.getCabinetState(); }
function normalizeSections(state) {
  const sections = Array.isArray(state.sections) && state.sections.length ? state.sections : [{ width: state.dimensions.width, shelves: 2, drawers: 0, facade: 'door' }];
  const total = sections.reduce((s, item) => s + Number(item.width || 500), 0) || state.dimensions.width;
  return sections.map(item => ({ ...item, ratio: Number(item.width || 500) / total }));
}
function buildModel() {
  const state = getState();
  clearGroup();
  const W = Math.max(.6, Number(state.dimensions.width) / 1000);
  const H = Math.max(.7, Number(state.dimensions.height) / 1000);
  const D = Math.max(.3, Number(state.dimensions.depth) / 1000);
  const panel = Math.min(.045, W / 45);
  const frontZ = D / 2 + .018;
  const color = cssColor('--furniture-color', '#b48a64');
  const dark = cssColor('--furniture-dark', '#805a3e');
  const body = mat(color, .34);
  const edge = mat(dark, .42);
  const back = mat(new THREE.Color(color).multiplyScalar(.7), .6);
  const handle = mat(state.hardware?.handles === 'brass' ? '#b6894d' : '#344139', .3, state.hardware?.handles === 'brass' ? .65 : .05);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#b9d4d1', transparent: true, opacity: .31, roughness: .15, metalness: .08 });

  box(panel, H, D, edge, -W / 2 + panel / 2, H / 2, 0);
  box(panel, H, D, edge, W / 2 - panel / 2, H / 2, 0);
  box(W - panel * 2, panel, D, body, 0, H - panel / 2, 0);
  box(W - panel * 2, panel, D, body, 0, panel / 2, 0);
  box(W - panel * 2, H - panel * 2, .025, back, 0, H / 2, -D / 2 + .015);

  let cursor = -W / 2 + panel;
  for (const section of normalizeSections(state)) {
    const sw = W * section.ratio;
    const x = cursor + sw / 2;
    if (cursor > -W / 2 + panel + .001) box(panel, H - panel * 2, D - .04, edge, cursor, H / 2, 0);
    const innerW = Math.max(.18, sw - panel * 1.4);
    const shelves = Math.min(8, Math.max(0, Number(section.shelves || 0)));
    for (let i = 1; i <= shelves; i++) box(innerW, panel * .72, D - .09, body, x, panel + (H - panel * 2) * i / (shelves + 1), .005);
    const drawers = 0;
    for (let i = 0; i < drawers; i++) {
      const dh = Math.min(.22, (H * .72) / Math.max(drawers, 1));
      const y = panel + dh * (i + .5);
      roundedBox(Math.max(.15, innerW - .045), dh - .018, .055, mat(new THREE.Color(color).lerp(new THREE.Color('#ffffff'), .12), .34), x, y, frontZ + .025, .018);
      box(Math.min(.11, innerW * .25), .012, .012, handle, x, y, frontZ + .06);
    }
    if (section.facade !== 'open') {
      const doorW = Math.max(.12, sw / 2 - .012);
      const doorMat = section.facade === 'glass' ? glass : mat(new THREE.Color(color).lerp(new THREE.Color('#ffffff'), .08), .3);
      for (let door = 0; door < 2; door++) {
        const dx = x - sw / 4 + door * sw / 2;
        roundedBox(doorW, H - panel * 2.3, .035, doorMat, dx, H / 2, frontZ + .035, .012);
        const handleX = dx + (door === 0 ? doorW * .37 : -doorW * .37);
        box(.012, Math.min(.28, H * .16), .018, handle, handleX, H * .53, frontZ + .075);
      }
    }
    cursor += sw;
  }
  if (state.mezzanine) {
    const mh = Math.min(.55, H * .22);
    box(W - panel * 1.4, mh, D, body, 0, H + mh / 2 + .025, 0);
    box(W - panel * 1.4, .025, D + .01, edge, 0, H + .025, frontZ * .62);
    box(panel, mh, D, edge, -W / 2 + panel, H + mh / 2 + .025, 0);
  }
  if (state.corner) {
    const cw = Math.max(.34, D * .86);
    const ch = H * .84;
    const cornerGroup = new THREE.Group();
    cornerGroup.position.x = W / 2 + cw / 2 - panel * .2;
    cabinetGroup.add(cornerGroup);
    box(cw, ch, D * .72, body, 0, ch / 2 + panel / 2, 0, cornerGroup);
    box(cw, .025, D * .72 + .02, edge, 0, ch - .015, D * .36, cornerGroup);
    box(cw / 2 - .012, ch - .04, .035, mat(new THREE.Color(color).lerp(new THREE.Color('#fff'), .08), .3), -cw / 4, ch / 2, D * .36 + .025, cornerGroup);
    box(cw / 2 - .012, ch - .04, .035, mat(new THREE.Color(color).lerp(new THREE.Color('#fff'), .08), .3), cw / 4, ch / 2, D * .36 + .025, cornerGroup);
  }
  cabinetGroup.position.set(0, 0, 0);
  const box3 = new THREE.Box3().setFromObject(cabinetGroup);
  const center = box3.getCenter(new THREE.Vector3());
  const size = box3.getSize(new THREE.Vector3());
  cabinetGroup.position.x = -center.x;
  cabinetGroup.position.y = -box3.min.y + .004;
  target.x = 0;
  fitDistance = Math.max(6.2, Math.max(size.y * 1.35, size.x * 1.15) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  target.set(0, center.y + cabinetGroup.position.y, center.z);
}
function syncCamera() {
  const state = getState();
  const c = state.camera || { x: 0, y: 0, zoom: 1 };
  if (!drag) { yaw = THREE.MathUtils.degToRad(Number(c.y || 0)); pitch = .08 + THREE.MathUtils.degToRad(Number(c.x || 0)); zoom = Number(c.zoom || 1); }
  const radius = fitDistance / Math.max(.72, Math.min(1.35, zoom));
  camera.position.set(Math.sin(yaw) * radius, target.y + Math.sin(pitch) * radius * .65, Math.cos(yaw) * radius);
  camera.lookAt(target);
}
function saveCamera() {
  const state = getState();
  state.camera = { x: THREE.MathUtils.radToDeg(pitch - .08), y: THREE.MathUtils.radToDeg(yaw), zoom };
  localStorage.setItem('buyantuev-editor-v1', JSON.stringify(state));
  window.dispatchEvent(new Event('cabinet:rendered'));
}
function resize() { const rect = root.getBoundingClientRect(); renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); }
function frame() { requestAnimationFrame(frame); syncCamera(); renderer.render(scene, camera); }
function scheduleBuild() { const state = getState(); const signature = JSON.stringify({ dimensions: state.dimensions, sections: state.sections, hardware: state.hardware, mezzanine: state.mezzanine, corner: state.corner, color: state.furnitureColor, mode: state.editorMode }); if (signature !== lastSignature) { lastSignature = signature; buildModel(); } }

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function hitModel(event) { const rect = canvas.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); return raycaster.intersectObjects(cabinetGroup.children, true).length > 0; }
canvas.addEventListener('pointerdown', event => { if (!hitModel(event)) return; drag = { x: event.clientX, y: event.clientY, yaw, pitch }; canvas.setPointerCapture(event.pointerId); root.classList.add('is-dragging'); });
canvas.addEventListener('pointermove', event => { if (!drag) return; yaw = drag.yaw - (event.clientX - drag.x) * .008; pitch = Math.max(-.18, Math.min(.48, drag.pitch - (event.clientY - drag.y) * .005)); });
function endDrag() { if (!drag) return; drag = null; root.classList.remove('is-dragging'); saveCamera(); }
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', event => { if (!hitModel(event)) return; event.preventDefault(); zoom = Math.max(.72, Math.min(1.35, zoom + (event.deltaY < 0 ? .05 : -.05))); saveCamera(); }, { passive: false });
function setZoom(value) { zoom = Math.max(.72, Math.min(1.35, value)); saveCamera(); }
document.getElementById('cameraMinus')?.addEventListener('click', () => setZoom(zoom - .08));
document.getElementById('cameraPlus')?.addEventListener('click', () => setZoom(zoom + .08));
document.getElementById('cameraReset')?.addEventListener('click', () => { yaw = 0; pitch = .08; zoom = 1; saveCamera(); });
document.getElementById('cameraFullscreen')?.addEventListener('click', async () => { if (!document.fullscreenElement) await root.requestFullscreen?.(); else await document.exitFullscreen?.(); resize(); });
window.addEventListener('cabinet:rendered', scheduleBuild);
window.addEventListener('resize', resize);
buildModel(); resize(); frame();
