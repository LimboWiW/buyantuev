/* 3D-конфигуратор: комната + шкаф.
   Камера вращается вокруг ЦЕНТРА КОМНАТЫ, шкаф стоит у задней стены —
   поэтому при перетаскивании поворачивается вся комната, а не сам шкаф.
   Оптимизации: ленивая загрузка three.js, рендер только при изменениях,
   статичные тени, кэш текстур, ограничение pixel ratio на мобильных. */

const root = document.querySelector('.scene');
const canvas = document.getElementById('threeCanvas');
if (!root || !canvas || !window.getCabinetState) throw new Error('3D editor mount is missing');

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

function showMessage(text) {
  const p = document.createElement('p');
  p.style.cssText = 'position:absolute;inset:0;z-index:6;display:grid;place-items:center;margin:0;padding:24px;text-align:center;color:#5f5a52;font:600 13px/1.5 system-ui,sans-serif';
  p.textContent = text;
  root.appendChild(p);
}

/* Грузим three.js только когда конфигуратор подъезжает к экрану */
await new Promise(resolve => {
  if (!('IntersectionObserver' in window)) return resolve();
  const io = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { io.disconnect(); resolve(); }
  }, { rootMargin: '700px 0px' });
  io.observe(root);
});

let THREE;
try { THREE = await import(THREE_URL); }
catch (error) { showMessage('Не удалось загрузить 3D-модуль. Проверьте соединение и обновите страницу.'); throw error; }

const isMobile = matchMedia('(max-width: 760px)').matches || /Mobi|Android/i.test(navigator.userAgent);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const BASE_PITCH = 0.08;
const ZOOM_MIN = 0.72, ZOOM_MAX = 1.35;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas, antialias: !isMobile, alpha: true,
    powerPreference: isMobile ? 'default' : 'high-performance'
  });
} catch (error) { showMessage('Ваш браузер не поддерживает WebGL, 3D-просмотр недоступен.'); throw error; }

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; /* сцена статична — тени считаем только при пересборке */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
const target = new THREE.Vector3(0, 1.3, 0);
const roomGroup = new THREE.Group();
const cabinetGroup = new THREE.Group();
scene.add(roomGroup, cabinetGroup);

/* ---------- Свет ---------- */
const ambient = new THREE.HemisphereLight(0xfff8e9, 0x5c6870, 2);
scene.add(ambient);
const key = new THREE.DirectionalLight(0xffe0b3, 3.2);
key.position.set(3.4, 5.5, 4.5);
key.castShadow = true;
key.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
key.shadow.camera.left = -4.5; key.shadow.camera.right = 4.5;
key.shadow.camera.top = 4.5; key.shadow.camera.bottom = -4.5;
key.shadow.camera.near = 0.5; key.shadow.camera.far = 16;
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
scene.add(key);
const fill = new THREE.DirectionalLight(0xcfe3ff, 1.1);
fill.position.set(-4, 2.4, 2);
scene.add(fill);

const LIGHT_COLORS = { warm: 0xffc46b, neutral: 0xfff9e8, cool: 0xcfe5ff };
function updateLights(state) {
  const s = clamp(Number(state.lightStrength ?? 65), 0, 100) / 100;
  const tint = new THREE.Color(LIGHT_COLORS[state.lightType] ?? LIGHT_COLORS.warm);
  ambient.intensity = 0.9 + s * 1.6;
  ambient.color.set(0xffffff).lerp(tint, 0.18);
  key.intensity = 1.4 + s * 3;
  key.color.set(0xffffff).lerp(tint, 0.5);
}

/* ---------- Состояние камеры ---------- */
let yaw = 0, pitch = BASE_PITCH, zoom = 1;
let drag = null, pinch = null;
let fitDistance = 6;
let roomSize = { w: 3.8, d: 3.6, h: 2.7 };

/* ---------- Вспомогательные ---------- */
function cssColor(name, fallback) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
function getState() { return window.getCabinetState(); }
function mat(color, roughness = 0.46, metalness = 0) { return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }
function box(w, h, d, material, x, y, z, parent = cabinetGroup) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function roundedBox(w, h, d, material, x, y, z, radius = 0.02) {
  const shape = new THREE.Shape();
  const r = Math.min(radius, w / 3, h / 3);
  shape.moveTo(-w / 2 + r, -h / 2); shape.lineTo(w / 2 - r, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); shape.lineTo(-w / 2, -h / 2 + r); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSegments: isMobile ? 1 : 2, bevelSize: 0.008, bevelThickness: 0.008 });
  geo.center();
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  cabinetGroup.add(mesh);
  return mesh;
}
function clearGroup(group) {
  group.traverse(obj => {
    if (!obj.isMesh) return;
    obj.geometry?.dispose();
    (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => { m?.map?.dispose(); m?.dispose(); });
  });
  group.clear();
}
function normalizeSections(state) {
  const sections = Array.isArray(state.sections) && state.sections.length ? state.sections : [{ width: state.dimensions.width, shelves: 2, drawers: 0, facade: 'door' }];
  const total = sections.reduce((s, item) => s + Number(item.width || 500), 0) || state.dimensions.width;
  return sections.map(item => ({ ...item, ratio: Number(item.width || 500) / total }));
}
function getDims(state) {
  return {
    W: Math.max(0.6, Number(state.dimensions.width) / 1000),
    H: Math.max(0.7, Number(state.dimensions.height) / 1000),
    D: Math.max(0.3, Number(state.dimensions.depth) / 1000)
  };
}

/* ---------- Текстуры комнаты (рисуются один раз, светлые — цвет умножается) ---------- */
const texCache = new Map();
function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function baseTexture(kind) {
  if (texCache.has(kind)) return texCache.get(kind);
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const rand = rng(7);
  g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256);
  if (kind === 'wallpaper') {
    g.fillStyle = 'rgba(40,60,40,.16)';
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
      g.beginPath(); g.arc(col * 32 + 8 + (row % 2) * 16, row * 32 + 16, 2.2, 0, Math.PI * 2); g.fill();
    }
  } else if (kind === 'tile') {
    g.fillStyle = '#e3e3e3'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#fff'; g.lineWidth = 4;
    for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
  } else if (kind === 'wood' || kind === 'laminate') {
    const spread = kind === 'wood' ? 34 : 16;
    const offsets = [0, 40, 90, 20];
    for (let row = 0; row < 4; row++) for (let k = -1; k < 3; k++) {
      const shade = 255 - Math.floor(rand() * spread);
      g.fillStyle = `rgb(${shade},${shade},${shade})`;
      g.fillRect(offsets[row] + k * 128, row * 64, 128, 64);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(offsets[row] + k * 128, row * 64, 2, 64);
    }
    g.fillStyle = 'rgba(0,0,0,.22)';
    for (let row = 0; row < 4; row++) g.fillRect(0, row * 64, 256, 2);
    if (kind === 'wood') { g.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 60; i++) g.fillRect(rand() * 256, rand() * 256, 30 + rand() * 60, 1); }
  } else if (kind === 'carpet') {
    g.fillStyle = 'rgba(0,0,0,.09)';
    for (let i = 0; i < 1400; i++) g.fillRect(rand() * 256, rand() * 256, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  texCache.set(kind, tex);
  return tex;
}
function surfaceMaterial(kind, color, roughness, areaW, areaH, tileMeters) {
  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  if (kind) {
    const tex = baseTexture(kind).clone();
    tex.repeat.set(areaW / tileMeters, areaH / tileMeters);
    tex.needsUpdate = true;
    material.map = tex;
  }
  return material;
}

/* ---------- Комната ---------- */
function buildRoom(state, dims) {
  clearGroup(roomGroup);
  const w = Math.max(3.8, dims.W + 1.6);
  const d = 3.6;
  const h = Math.max(2.7, dims.H + 0.3);
  roomSize = { w, d, h };

  const wallHex = cssColor('--wall-color', '#e6ded3');
  const floorHex = cssColor('--floor-color', '#c8a078');
  const wallKind = state.wallType === 'wallpaper' ? 'wallpaper' : state.wallType === 'tile' ? 'tile' : null;
  const wallTile = wallKind === 'tile' ? 1 : 0.5;
  const floorKind = ['wood', 'laminate', 'tile', 'carpet'].includes(state.floorType) ? state.floorType : 'laminate';
  const floorTile = floorKind === 'tile' ? 1.6 : floorKind === 'carpet' ? 1 : 0.8;

  /* Пол */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), surfaceMaterial(floorKind, floorHex, floorKind === 'carpet' ? 0.95 : 0.6, w, d, floorTile));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  roomGroup.add(floor);

  /* Стены односторонние: снаружи они «исчезают», поэтому комната видна с любой стороны */
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), surfaceMaterial(wallKind, wallHex, 0.9, w, h, wallTile));
  back.position.set(0, h / 2, -d / 2);
  back.receiveShadow = true;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(d, h), surfaceMaterial(wallKind, wallHex, 0.9, d, h, wallTile));
  left.position.set(-w / 2, h / 2, 0);
  left.rotation.y = Math.PI / 2;
  left.receiveShadow = true;
  const right = new THREE.Mesh(new THREE.PlaneGeometry(d, h), surfaceMaterial(wallKind, wallHex, 0.9, d, h, wallTile));
  right.position.set(w / 2, h / 2, 0);
  right.rotation.y = -Math.PI / 2;
  right.receiveShadow = true;
  roomGroup.add(back, left, right);

  /* Плинтусы */
  const bb = () => new THREE.MeshStandardMaterial({ color: 0xf4f1e9, roughness: 0.7 });
  const bh = 0.08, bt = 0.018;
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(w, bh, bt), bb()); b1.position.set(0, bh / 2, -d / 2 + bt / 2);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(bt, bh, d), bb()); b2.position.set(-w / 2 + bt / 2, bh / 2, 0);
  const b3 = new THREE.Mesh(new THREE.BoxGeometry(bt, bh, d), bb()); b3.position.set(w / 2 - bt / 2, bh / 2, 0);
  roomGroup.add(b1, b2, b3);

  /* Центр вращения — центр комнаты; смотрим чуть выше середины, чтобы шкаф сидел ниже в кадре */
  target.set(0, h * 0.52 + 0.08, 0);
}

/* ---------- Шкаф ---------- */
function buildModel(state, dims) {
  clearGroup(cabinetGroup);
  const { W, H, D } = dims;
  const panel = Math.min(0.045, W / 45);
  const frontZ = D / 2 + 0.018;
  const color = cssColor('--furniture-color', '#b48a64');
  const dark = cssColor('--furniture-dark', '#805a3e');
  const body = mat(color, 0.34);
  const edge = mat(dark, 0.42);
  const back = mat(new THREE.Color(color).multiplyScalar(0.7), 0.6);
  const handle = mat(state.hardware?.handles === 'brass' ? '#b6894d' : '#344139', 0.3, state.hardware?.handles === 'brass' ? 0.65 : 0.05);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#b9d4d1', transparent: true, opacity: 0.31, roughness: 0.15, metalness: 0.08 });

  box(panel, H, D, edge, -W / 2 + panel / 2, H / 2, 0);
  box(panel, H, D, edge, W / 2 - panel / 2, H / 2, 0);
  box(W - panel * 2, panel, D, body, 0, H - panel / 2, 0);
  box(W - panel * 2, panel, D, body, 0, panel / 2, 0);
  box(W - panel * 2, H - panel * 2, 0.025, back, 0, H / 2, -D / 2 + 0.015);

  let cursor = -W / 2 + panel;
  for (const section of normalizeSections(state)) {
    const sw = W * section.ratio;
    const x = cursor + sw / 2;
    if (cursor > -W / 2 + panel + 0.001) box(panel, H - panel * 2, D - 0.04, edge, cursor, H / 2, 0);
    const innerW = Math.max(0.18, sw - panel * 1.4);
    const shelves = Math.min(8, Math.max(0, Number(section.shelves || 0)));
    for (let i = 1; i <= shelves; i++) box(innerW, panel * 0.72, D - 0.09, body, x, panel + (H - panel * 2) * i / (shelves + 1), 0.005);
    const drawers = 0;
    for (let i = 0; i < drawers; i++) {
      const dh = Math.min(0.22, (H * 0.72) / Math.max(drawers, 1));
      const y = panel + dh * (i + 0.5);
      roundedBox(Math.max(0.15, innerW - 0.045), dh - 0.018, 0.055, mat(new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.12), 0.34), x, y, frontZ + 0.025, 0.018);
      box(Math.min(0.11, innerW * 0.25), 0.012, 0.012, handle, x, y, frontZ + 0.06);
    }
    if (section.facade !== 'open') {
      const doorW = Math.max(0.12, sw / 2 - 0.012);
      const doorMat = section.facade === 'glass' ? glass : mat(new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.08), 0.3);
      for (let door = 0; door < 2; door++) {
        const dx = x - sw / 4 + door * sw / 2;
        roundedBox(doorW, H - panel * 2.3, 0.035, doorMat, dx, H / 2, frontZ + 0.035, 0.012);
        const handleX = dx + (door === 0 ? doorW * 0.37 : -doorW * 0.37);
        box(0.012, Math.min(0.28, H * 0.16), 0.018, handle, handleX, H * 0.53, frontZ + 0.075);
      }
    }
    cursor += sw;
  }
  /* Шкаф стоит на полу вплотную к задней стене; вращается комната, а не он */
  cabinetGroup.position.set(0, 0, -roomSize.d / 2 + D / 2 + 0.006);
}

/* ---------- Камера ---------- */
function fit() {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const needV = (roomSize.h * 1.18) / (2 * Math.tan(vFov / 2));
  const needH = (roomSize.w * 1.08) / (2 * Math.tan(hFov / 2));
  fitDistance = Math.max(4, needV, needH);
}
function syncCamera() {
  const state = getState();
  const c = state.camera || { x: 0, y: 0, zoom: 1 };
  if (!drag && !pinch) {
    yaw = THREE.MathUtils.degToRad(Number(c.y || 0));
    pitch = BASE_PITCH + THREE.MathUtils.degToRad(Number(c.x || 0));
    zoom = Number(c.zoom || 1);
  }
  const radius = fitDistance / clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  camera.position.set(
    target.x + Math.sin(yaw) * radius,
    target.y + Math.sin(pitch) * radius * 0.65,
    target.z + Math.cos(yaw) * radius
  );
  camera.lookAt(target);
}
function saveCamera() {
  const state = getState();
  state.camera = { x: THREE.MathUtils.radToDeg(pitch - BASE_PITCH), y: THREE.MathUtils.radToDeg(yaw), zoom };
  try { localStorage.setItem('buyantuev-editor-v1', JSON.stringify(state)); } catch (e) { /* приватный режим */ }
  const out = document.getElementById('cameraZoomValue');
  if (out) out.textContent = Math.round(zoom * 100) + '%';
  window.dispatchEvent(new Event('cabinet:rendered'));
}

/* ---------- Рендер по требованию ---------- */
let raf = 0;
let builtSig = '';
let lightSig = '';
function requestRender() { if (!raf) raf = requestAnimationFrame(frame); }
function frame() {
  raf = 0;
  const state = getState();
  const sig = JSON.stringify([state.dimensions, state.sections, state.hardware, state.furnitureColor, state.wallColor, state.wallType, state.floorColor, state.floorType]);
  if (sig !== builtSig) {
    builtSig = sig;
    const dims = getDims(state);
    buildRoom(state, dims);
    buildModel(state, dims);
    fit();
    renderer.shadowMap.needsUpdate = true;
  }
  const lsig = state.lightType + ':' + state.lightStrength;
  if (lsig !== lightSig) { lightSig = lsig; updateLights(state); }
  syncCamera();
  renderer.render(scene, camera);
}
function resize() {
  const w = Math.max(1, root.clientWidth), h = Math.max(1, root.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  fit();
  requestRender();
}

/* ---------- Управление: вращаем комнату (drag в любом месте сцены) ---------- */
const pointers = new Map();
const pointerDistance = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
canvas.addEventListener('pointerdown', event => {
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  try { canvas.setPointerCapture(event.pointerId); } catch (e) { /* noop */ }
  if (pointers.size === 1) { drag = { x: event.clientX, y: event.clientY, yaw, pitch }; root.classList.add('is-dragging'); }
  else if (pointers.size === 2) { drag = null; pinch = { d: pointerDistance(), zoom }; }
});
canvas.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pinch && pointers.size === 2) { zoom = clamp(pinch.zoom * pointerDistance() / pinch.d, ZOOM_MIN, ZOOM_MAX); requestRender(); return; }
  if (!drag) return;
  yaw = drag.yaw - (event.clientX - drag.x) * 0.008;
  /* На тач-экранах вертикальный свайп оставляем странице (прокрутка), наклон — только мышью */
  if (event.pointerType !== 'touch') pitch = clamp(drag.pitch - (event.clientY - drag.y) * 0.005, -0.18, 0.48);
  requestRender();
});
function endPointer(event) {
  const wasPinch = !!pinch;
  pointers.delete(event.pointerId);
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 0) { drag = null; root.classList.remove('is-dragging'); saveCamera(); }
  else if (wasPinch && !pinch) saveCamera();
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
/* Колесо мыши не перехватываем без Ctrl/⌘, чтобы не ломать прокрутку страницы */
canvas.addEventListener('wheel', event => {
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  zoom = clamp(zoom + (event.deltaY < 0 ? 0.05 : -0.05), ZOOM_MIN, ZOOM_MAX);
  saveCamera();
}, { passive: false });
canvas.tabIndex = 0;
canvas.addEventListener('keydown', event => {
  const step = { ArrowLeft: -0.12, ArrowRight: 0.12 }[event.key];
  if (step) { yaw += step; saveCamera(); event.preventDefault(); }
  else if (event.key === '+' || event.key === '=') { zoom = clamp(zoom + 0.08, ZOOM_MIN, ZOOM_MAX); saveCamera(); }
  else if (event.key === '-') { zoom = clamp(zoom - 0.08, ZOOM_MIN, ZOOM_MAX); saveCamera(); }
});

function setZoom(value) { zoom = clamp(value, ZOOM_MIN, ZOOM_MAX); saveCamera(); }
document.getElementById('cameraMinus')?.addEventListener('click', () => setZoom(zoom - 0.08));
document.getElementById('cameraPlus')?.addEventListener('click', () => setZoom(zoom + 0.08));
document.getElementById('cameraReset')?.addEventListener('click', () => { yaw = 0; pitch = BASE_PITCH; zoom = 1; saveCamera(); });
document.getElementById('cameraFullscreen')?.addEventListener('click', async () => {
  if (!document.fullscreenElement) await root.requestFullscreen?.(); else await document.exitFullscreen?.();
});

window.addEventListener('cabinet:rendered', requestRender);
new ResizeObserver(resize).observe(root);

/* Потеря WebGL-контекста на мобильных: восстанавливаемся без перезагрузки */
canvas.addEventListener('webglcontextlost', event => event.preventDefault());
canvas.addEventListener('webglcontextrestored', () => { builtSig = ''; lightSig = ''; texCache.clear(); requestRender(); });

resize();
