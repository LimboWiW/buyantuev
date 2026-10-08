/* 3D-конфигуратор: комната + шкаф.
   Камера вращается вокруг ЦЕНТРА КОМНАТЫ, шкаф стоит у задней стены —
   поэтому при перетаскивании поворачивается вся комната, а не сам шкаф.
   Оптимизации: ленивая загрузка three.js, рендер только при изменениях,
   статичные тени, кэш текстур, ограничение pixel ratio на мобильных. */

const root = document.querySelector('.scene');
const canvas = document.getElementById('threeCanvas');
if (!root || !canvas || !window.getCabinetState) throw new Error('3D editor mount is missing');

const THREE_URL = new URL('../vendor/three.module.min.js', import.meta.url).href;

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
const ZOOM_MIN = 0.5, ZOOM_MAX = 1.45;

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

/* ---------- Декоры (текстурные материалы) ---------- */
function hashStr(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
const kindTexCache = new Map();
function kindMap(kind, vertical, seed) {
  const key = kind + (vertical ? 'v' : 'h') + seed;
  if (!kindTexCache.has(key)) {
    const t = new THREE.CanvasTexture(window.BTex.canvas(kind, isMobile ? 256 : 512, { seed, vertical }));
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    kindTexCache.set(key, t);
  }
  return kindTexCache.get(key);
}
function texMat(kind, tint, roughness, tile, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: tint, map: kindMap(kind, o.vertical !== false, o.seed || 7), roughness, metalness: 0 });
  m.userData.tile = tile;
  return m;
}
function decorOf(state) {
  return state.decor && state.decor !== 'none' && window.DECORS ? window.DECORS.find(d => d.id === state.decor) || null : null;
}
function decorMat(decor, roughness, shade = 1) {
  return texMat(decor.kind, new THREE.Color(decor.tint).multiplyScalar(shade), roughness, decor.kind === 'concrete' ? 0.8 : 0.5, { seed: hashStr(decor.id) % 40 + 1 });
}
function uvOffsets(x, y, z) {
  return [Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1, Math.abs(Math.sin(x * 39.346 + y * 11.135 + z * 83.155) * 24634.6345) % 1];
}
function scaleBoxUV(geo, w, h, d, tile, x, y, z) {
  const uv = geo.attributes.uv, [ou, ov] = uvOffsets(x, y, z);
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const idx = f * 4 + i;
    uv.setXY(idx, uv.getX(idx) * dims[f][0] / tile + ou, uv.getY(idx) * dims[f][1] / tile + ov);
  }
  uv.needsUpdate = true;
}
function scaleUV(geo, tile, x, y, z) {
  const uv = geo.attributes.uv, [ou, ov] = uvOffsets(x, y, z);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / tile + ou, uv.getY(i) / tile + ov);
  uv.needsUpdate = true;
}
function box(w, h, d, material, x, y, z, parent = cabinetGroup) {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (material.userData.tile) scaleBoxUV(geo, w, h, d, material.userData.tile, x, y, z);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function roundedBox(w, h, d, material, x, y, z, radius = 0.02, parent = cabinetGroup) {
  const shape = new THREE.Shape();
  const r = Math.min(radius, w / 3, h / 3);
  shape.moveTo(-w / 2 + r, -h / 2); shape.lineTo(w / 2 - r, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); shape.lineTo(-w / 2, -h / 2 + r); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSegments: isMobile ? 1 : 2, bevelSize: 0.008, bevelThickness: 0.008 });
  geo.center();
  if (material.userData.tile) scaleUV(geo, material.userData.tile, x, y, z);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh);
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
const TEX_KIND = { wood: 'planks', laminate: 'laminate', tile: 'tile', carpet: 'carpet', wallpaper: 'wallpaper', plaster: 'plaster', parquet: 'parquet', concrete: 'concrete', brick: 'brick' };
const BUMP = { wood: 0.7, laminate: 0.5, tile: 0.9, plaster: 0.25, wallpaper: 0.15, carpet: 0.3, parquet: 0.6, concrete: 0.25, brick: 0.9 };
function baseTexture(kind) {
  if (texCache.has(kind)) return texCache.get(kind);
  const size = kind === 'tile' || kind === 'wallpaper' || kind === 'brick' ? 256 : (isMobile ? 256 : 512);
  const tex = new THREE.CanvasTexture(window.BTex.canvas(TEX_KIND[kind] || kind, size));
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
    material.bumpMap = tex;
    material.bumpScale = BUMP[kind] ?? 0.3;
  }
  return material;
}

/* ---------- Комната ---------- */
function buildRoom(state, dims) {
  clearGroup(roomGroup);
  const room = state.product === 'kitchen' ? kitchenRoom(getKitchen(state)) : { w: Math.max(3.8, dims.W + 1.6), d: 3.6, h: Math.max(2.7, dims.H + 0.3) };
  const { w, d, h } = room;
  roomSize = { w, d, h };

  const wallHex = cssColor('--wall-color', '#e6ded3');
  const floorHex = cssColor('--floor-color', '#c8a078');
  const wallKind = ['wallpaper', 'tile', 'brick', 'concrete'].includes(state.wallType) ? state.wallType : 'plaster';
  const wallTile = { tile: 1, plaster: 1.5, wallpaper: 0.5, brick: 1.0, concrete: 2.0 }[wallKind];
  const floorKind = ['wood', 'laminate', 'tile', 'carpet', 'parquet', 'concrete'].includes(state.floorType) ? state.floorType : 'laminate';
  const floorTile = { tile: 1.2, carpet: 0.8, parquet: 1.5, concrete: 2.0, wood: 1.3, laminate: 1.3 }[floorKind];

  /* Пол */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), surfaceMaterial(floorKind, floorHex, floorKind === 'carpet' ? 0.95 : floorKind === 'concrete' ? 0.85 : 0.6, w, d, floorTile));
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


  /* Подиум: комната стоит на плите, как макет на подставке, и вращается на тёмном фоне */
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.56, 0.16, d + 0.56), new THREE.MeshStandardMaterial({ color: 0xd8d0c2, roughness: 0.78 }));
  slab.position.set(0, -0.082, 0.0);
  slab.receiveShadow = true;
  roomGroup.add(slab);
  const glow = document.createElement('canvas');
  glow.width = glow.height = 128;
  const gg = glow.getContext('2d');
  const grad = gg.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,.55)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  gg.fillStyle = grad; gg.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(glow);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry((w + 0.56) * 1.9, (d + 0.56) * 1.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = -0.165;
  roomGroup.add(blob);

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
  const decor = decorOf(state);
  const open = !!state.doorsOpen;
  const body = decor ? decorMat(decor, 0.34, 1) : mat(color, 0.34);
  const edge = decor ? decorMat(decor, 0.42, 0.82) : mat(dark, 0.42);
  const back = mat(new THREE.Color(decor ? decor.tint : color).multiplyScalar(0.7), 0.6);
  const faceMat = decor ? decorMat(decor, 0.3, 1.04) : mat(new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.08), 0.3);
  const brass = state.hardware?.handles === 'brass';
  const handle = mat(brass ? '#b6894d' : '#344139', 0.3, brass ? 0.65 : 0.05);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#b9d4d1', transparent: true, opacity: 0.31, roughness: 0.15, metalness: 0.08 });
  const steel = mat('#cfd5d8', 0.28, 0.7);
  const clothes = ['#6b7a8f', '#b3ada3', '#c9b79c', '#7d8f7a', '#3f4a57', '#b4887a', '#e5e0d6', '#5b4a4a'].map(c => mat(c, 0.85));

  box(panel, H, D, edge, -W / 2 + panel / 2, H / 2, 0);
  box(panel, H, D, edge, W / 2 - panel / 2, H / 2, 0);
  box(W - panel * 2, panel, D, body, 0, H - panel / 2, 0);
  box(W - panel * 2, panel, D, body, 0, panel / 2, 0);
  box(W - panel * 2, H - panel * 2, 0.025, back, 0, H / 2, -D / 2 + 0.015);

  let cursor = -W / 2 + panel;
  let index = 0;
  for (const section of normalizeSections(state)) {
    index++;
    const sw = (W - panel * 2) * section.ratio; /* секции делят только внутреннюю ширину */
    const x = cursor + sw / 2;
    if (cursor > -W / 2 + panel + 0.001) box(panel, H - panel * 2, D - 0.04, edge, cursor, H / 2, 0);
    const innerW = Math.max(0.18, sw - 0.004);

    /* Ящики внизу секции: фронты на всю ширину, над ними перегородка */
    const drawersN = Math.min(6, Math.max(0, Math.round(Number(section.drawers || 0))));
    const dh = drawersN ? Math.min(0.22, Math.max(0.12, (H * 0.4) / drawersN)) : 0;
    const drawersTop = drawersN ? panel + drawersN * dh : panel;
    const zoneTop = H - panel;
    if (drawersN) {
      box(innerW, panel * 0.72, D - 0.09, body, x, drawersTop + panel * 0.36, 0.005);
      for (let i = 0; i < drawersN; i++) {
        const y = panel + dh * (i + 0.5);
        roundedBox(innerW - 0.008, dh - 0.008, 0.035, faceMat, x, y, frontZ + 0.035, 0.012);
        box(Math.min(0.3, innerW * 0.5), 0.012, 0.018, handle, x, y + dh * 0.27, frontZ + 0.075);
      }
    }

    /* Штанга и полки в верхней зоне */
    const rodY = section.rod ? Math.min(zoneTop - 0.1, drawersTop + (zoneTop - drawersTop) * 0.9) : null;
    const shelves = Math.min(8, Math.max(0, Number(section.shelves || 0)));
    for (let i = 1; i <= shelves; i++) {
      const y = drawersTop + (zoneTop - drawersTop) * i / (shelves + 1);
      if (rodY !== null && y > rodY - 1.15 && y < rodY + 0.05) continue; /* под штангой место для одежды */
      box(innerW, panel * 0.72, D - 0.09, body, x, y, 0.005);
    }
    if (rodY !== null) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, innerW - 0.03, 16), steel);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(x, rodY, 0.005);
      rod.castShadow = true;
      cabinetGroup.add(rod);
      for (const side of [-1, 1]) box(0.02, 0.04, 0.045, steel, x + side * (innerW / 2 - 0.012), rodY, 0.005);
      const n = Math.min(10, Math.max(2, Math.floor((innerW - 0.1) / 0.065)));
      const maxLen = Math.max(0.3, rodY - drawersTop - 0.14);
      for (let i = 0; i < n; i++) {
        const gx = x - innerW / 2 + 0.05 + i * (innerW - 0.1) / (n - 1);
        const len = Math.min(maxLen, 0.55 + 0.42 * hash01(index * 31 + i));
        box(0.042, len, Math.min(0.42, D - 0.16), clothes[(i + index) % clothes.length], gx, rodY - 0.07 - len / 2, 0.005);
      }
    }

    /* Двери: качаются на петлях (в режиме «Двери открыты» видно наполнение) */
    if (section.facade !== 'open') {
      const doorW = Math.max(0.12, sw / 2 - 0.012);
      const doorMat = section.facade === 'glass' ? glass : faceMat;
      const y0 = drawersN ? drawersTop + 0.006 : panel * 1.15, y1 = H - panel * 1.15, dH = y1 - y0;
      for (let door = 0; door < 2; door++) {
        const dx = x - sw / 4 + door * sw / 2;
        const sign = door === 0 ? 1 : -1; /* смещение полотна от петли */
        const pivot = new THREE.Group();
        pivot.position.set(door === 0 ? dx - doorW / 2 : dx + doorW / 2, (y0 + y1) / 2, frontZ + 0.035);
        pivot.rotation.y = open ? (door === 0 ? -1.75 : 1.75) : 0;
        roundedBox(doorW, dH, 0.035, doorMat, sign * doorW / 2, 0, 0, 0.012, pivot);
        const hx = sign * doorW / 2 + (door === 0 ? doorW * 0.37 : -doorW * 0.37);
        box(0.012, Math.min(0.28, dH * 0.16), 0.018, handle, hx, dH * 0.03, 0.04, pivot);
        cabinetGroup.add(pivot);
      }
    }
    cursor += sw;
  }
  /* Шкаф стоит на полу вплотную к задней стене; по горизонтали его двигает applyShift */
  cabinetGroup.position.set(0, 0, -roomSize.d / 2 + D / 2 + 0.006);
}
function hash01(n) { return Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1; }

/* ---------- Кухня ---------- */
const COUNTER_HEX = { laminate: 0xb78f64, white: 0xece8df, graphite: 0x3d4140, marble: 0xe0ddd6, oakwood: 0xc79a62, concrete: 0x9c9b97, granite: 0x1f2224, quartz: 0xcdbfa8, walnut: 0x8b5e3c };
const PLINTH = 0.1, BASE_H = 0.72, TOP_T = 0.04, TOP_Y = PLINTH + BASE_H + TOP_T, UPPER_BOTTOM = 1.45, UPPER_D = 0.32;
const FULL_TYPES = new Set(['tall', 'fridge']);
let kitchenRects = [];

function getKitchen(state) {
  const k = state.kitchen || {};
  const modules = (Array.isArray(k.modules) && k.modules.length ? k.modules : [{ width: 600, type: 'base' }])
    .map(m => ({ type: m.type || 'base', w: Math.max(0.3, Number(m.width || 600) / 1000), drawers: Number(m.drawers) || 0 }));
  const dims = k.dimensions || {};
  return {
    layout: ['straight', 'l', 'u'].includes(k.layout) ? k.layout : 'straight',
    side: Math.max(1.2, Number(k.side || 2000) / 1000),
    uppers: k.uppers !== false,
    counter: k.counter in COUNTER_HEX ? k.counter : 'laminate',
    modules,
    W: modules.reduce((s, m) => s + m.w, 0),
    H: Math.max(2.0, Number(dims.height || 2300) / 1000),
    D: Math.max(0.5, Number(dims.depth || 600) / 1000),
    handle: state.hardware?.handles || 'basic'
  };
}
function kitchenRoom(K) {
  const w = K.layout === 'u' ? Math.max(K.W, 2.4) : K.layout === 'l' ? Math.max(3.4, K.W + 0.9) : Math.max(3.8, K.W + 1.6);
  const d = K.layout === 'straight' ? 3.6 : Math.max(3.4, K.side + 1.5);
  return { w, d, h: Math.max(2.7, K.H + 0.35) };
}
function fillRun(len) {
  if (len < 0.3) return [];
  const n = Math.floor(len / 0.6);
  if (n === 0) return [{ w: len }];
  const rest = len - n * 0.6;
  const parts = Array.from({ length: n }, () => ({ w: 0.6 }));
  if (rest >= 0.3) parts.push({ w: rest }); else parts[n - 1].w += rest;
  return parts;
}

function buildKitchen(state) {
  clearGroup(cabinetGroup);
  cabinetGroup.position.set(0, 0, 0);
  const K = getKitchen(state);
  const { w: RW, d: RD } = roomSize;
  const D = K.D;
  const brass = K.handle === 'brass';
  const counterColor = new THREE.Color(COUNTER_HEX[K.counter]);
  const decor = decorOf(state);
  const faceTint = new THREE.Color(cssColor('--furniture-color', '#b48a64'));
  const tintForLum = decor ? new THREE.Color(decor.tint) : faceTint;
  const lightFace = tintForLum.getHSL({}, THREE.SRGBColorSpace).l > 0.5;
  const COUNTER_TEX = { laminate: ['oak', false, 0.7], white: ['quartz', true, 0.6], graphite: ['granite', true, 0.6], marble: ['marble', true, 0.9], oakwood: ['oak', false, 0.5], concrete: ['concrete', true, 0.8], granite: ['granite', true, 0.5], quartz: ['quartz', true, 0.5], walnut: ['walnut', false, 0.6] };
  const [ck, cv, ct] = COUNTER_TEX[K.counter];
  const M = {
    face: decor ? decorMat(decor, 0.36, 1.03) : mat(faceTint, 0.38),
    carcass: decor ? decorMat(decor, 0.55, 0.78) : mat(faceTint.clone().lerp(new THREE.Color(cssColor('--furniture-dark', '#805a3e')), 0.3), 0.6), /* торцы шкафов видны — в тон фасадов */
    plinth: mat('#25282a', 0.8),
    top: texMat(ck, counterColor, 0.28, ct, { vertical: cv, seed: 11 }),
    apron: texMat(ck, counterColor, 0.3, ct, { vertical: cv, seed: 11 }), /* фартук из того же материала, что и столешница */
    steel: mat('#b8bfc3', 0.32, 0.65),
    black: mat('#14181a', 0.22, 0.15),
    handle: mat(brass ? '#b6894d' : '#2d3733', 0.3, brass ? 0.65 : 0.1),
    groove: mat('#1b1f1e', 0.6),
    /* холодильник контрастирует с фасадами: на светлых — графит, на тёмных — светлая сталь */
    fridge: mat(lightFace ? '#2b3034' : '#dde2e5', 0.36, 0.25),
    fridgeBody: mat('#15181a', 0.6),
    fridgeHandle: mat(lightFace ? '#c9d0d4' : '#20252a', 0.3, 0.6)
  };
  const put = (g, w, h, d, material, x, y, z) => box(w, h, d, material, x, y, z, g);
  const cyl = (g, r, h, material, x, y, z, rotX = 0) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), material);
    m.position.set(x, y, z); m.rotation.x = rotX; m.castShadow = true;
    g.add(m);
  };
  const grip = (g, o) => {
    if (K.handle === 'profile') put(g, o.w * 0.94, 0.012, 0.006, M.groove, o.cx, o.yEdge, o.z + 0.002);
    else if (o.horizontal) put(g, Math.min(0.3, o.w * 0.6), 0.012, 0.016, M.handle, o.hx, o.y, o.z + 0.008);
    else put(g, 0.012, 0.16, 0.016, M.handle, o.hx, o.y, o.z + 0.008);
  };
  /* Дверцы: одна, если модуль узкий, иначе две */
  const doorSet = (g, cx, w, ya, yb, hy, ye, zf) => {
    const n = w > 0.5 ? 2 : 1, dw = w / n;
    for (let i = 0; i < n; i++) {
      const dx = cx - w / 2 + dw * (i + 0.5);
      put(g, dw - 0.006, yb - ya - 0.006, 0.018, M.face, dx, (ya + yb) / 2, zf - 0.009);
      const side = n === 1 || i === 0 ? 1 : -1;
      grip(g, { cx: dx, hx: dx + side * (dw / 2 - 0.035), y: hy, yEdge: ye, w: dw, z: zf });
    }
  };
  const drawerFronts = (g, cx, w, y0, h, shares) => {
    const total = shares.reduce((s, v) => s + v, 0);
    let y = y0;
    shares.forEach(share => {
      const fh = h * share / total;
      put(g, w - 0.006, fh - 0.004, 0.018, M.face, cx, y + fh / 2, D - 0.009);
      grip(g, { cx, hx: cx, y: y + fh - 0.05, yEdge: y + fh - 0.014, w, z: D, horizontal: true });
      y += fh;
    });
  };

  const lowerModule = (g, m, x0) => {
    const w = m.w, cx = x0 + w / 2;
    if (m.type === 'tall') {
      put(g, w - 0.004, K.H, D - 0.02, M.carcass, cx, K.H / 2, (D - 0.02) / 2);
      const split = Math.min(1.5, K.H * 0.62);
      doorSet(g, cx, w, 0.003, split, split - 0.12, split - 0.018, D);
      doorSet(g, cx, w, split + 0.003, K.H - 0.003, split + 0.12, split + 0.02, D);
      return;
    }
    if (m.type === 'fridge') {
      const hF = Math.min(1.75, K.H - 0.25), wF = w - 0.008, lowH = 0.6;
      put(g, wF, hF, D - 0.02, M.fridgeBody, cx, hF / 2, (D - 0.02) / 2);
      put(g, wF - 0.006, lowH - 0.004, 0.022, M.fridge, cx, lowH / 2 + 0.002, D - 0.011);
      put(g, wF - 0.006, hF - lowH - 0.008, 0.022, M.fridge, cx, lowH + 0.004 + (hF - lowH - 0.008) / 2, D - 0.011);
      put(g, 0.012, 0.42, 0.026, M.fridgeHandle, cx + wF / 2 - 0.05, lowH + 0.36, D + 0.012);
      put(g, 0.012, 0.26, 0.026, M.fridgeHandle, cx + wF / 2 - 0.05, lowH - 0.2, D + 0.012);
      if (K.uppers && K.H - hF > 0.12) {
        const fy0 = hF + 0.015, fh = K.H - fy0; /* антресоль над холодильником стоит выше него с зазором */
        put(g, w - 0.004, fh, D - 0.02, M.carcass, cx, fy0 + fh / 2, (D - 0.02) / 2);
        doorSet(g, cx, w, fy0 + 0.003, K.H - 0.003, fy0 + 0.1, fy0 + 0.02, D);
      }
      return;
    }
    put(g, w - 0.004, BASE_H, D - 0.02, M.carcass, cx, PLINTH + BASE_H / 2, (D - 0.02) / 2);
    put(g, w, TOP_T, D + 0.025, M.top, cx, PLINTH + BASE_H + TOP_T / 2, (D + 0.025) / 2);
    put(g, w, UPPER_BOTTOM - TOP_Y, 0.012, M.apron, cx, (UPPER_BOTTOM + TOP_Y) / 2, 0.006);
    const y0 = PLINTH + 0.003, h = BASE_H - 0.006;
    if (m.type === 'drawers') {
      const n = Math.min(4, Math.max(1, m.drawers || 3));
      drawerFronts(g, cx, w, y0, h, Array.from({ length: n }, (_, i) => 1 + (n - 1 - i) * 0.45));
    } else if (m.type === 'hob') {
      drawerFronts(g, cx, w, y0, h, [1, 2.4]);
      const pw = Math.min(w - 0.04, 0.58);
      put(g, pw, 0.008, 0.5, M.black, cx, TOP_Y + 0.004, D * 0.5);
      const dx = pw * 0.22, dz = 0.11;
      const spots = w >= 0.5 ? [[-dx, -dz], [dx, -dz], [-dx, dz], [dx, dz]] : [[0, -dz], [0, dz]];
      spots.forEach(([ox, oz]) => cyl(g, 0.062, 0.004, M.steel, cx + ox, TOP_Y + 0.0095, D * 0.5 + oz));
    } else if (m.type === 'oven') {
      const ovenH = 0.36, yTop = y0 + h - ovenH - 0.01;
      put(g, w - 0.006, ovenH, 0.018, M.black, cx, y0 + h - ovenH / 2, D - 0.009);
      put(g, w * 0.7, 0.014, 0.02, M.steel, cx, y0 + h - 0.05, D + 0.008);
      put(g, w - 0.006, yTop - y0 - 0.004, 0.018, M.face, cx, y0 + (yTop - y0) / 2, D - 0.009);
      grip(g, { cx, hx: cx, y: yTop - 0.05, yEdge: yTop - 0.014, w, z: D, horizontal: true });
    } else {
      const dk = m.type === 'base' ? Math.min(2, m.drawers || 0) : 0, zone = dk ? dk * 0.16 + 0.004 : 0;
      doorSet(g, cx, w, y0, y0 + h - zone, y0 + h - zone - 0.12, y0 + h - zone - 0.018, D);
      if (dk) drawerFronts(g, cx, w, y0 + h - zone, zone, Array(dk).fill(1));
      if (m.type === 'sink') {
        const sw = Math.min(w - 0.1, 0.7);
        put(g, sw, 0.01, 0.42, M.steel, cx, TOP_Y + 0.005, D * 0.5);
        put(g, sw - 0.06, 0.002, 0.33, M.black, cx, TOP_Y + 0.011, D * 0.5);
        cyl(g, 0.013, 0.27, M.steel, cx, TOP_Y + 0.135, 0.1);
        cyl(g, 0.011, 0.16, M.steel, cx, TOP_Y + 0.27, 0.18, Math.PI / 2);
      }
    }
  };
  const upperModule = (g, u) => {
    const cx = u.x + u.w / 2;
    if (u.hood) {
      put(g, Math.max(0.4, u.w - 0.1), 0.12, 0.48, M.steel, cx, UPPER_BOTTOM + 0.06, 0.24);
      const ch = K.H - (UPPER_BOTTOM + 0.12);
      if (ch > 0.05) put(g, 0.22, ch, 0.22, M.steel, cx, UPPER_BOTTOM + 0.12 + ch / 2, 0.11);
      return;
    }
    const UH = Math.max(0.4, K.H - UPPER_BOTTOM);
    put(g, u.w - 0.004, UH, UPPER_D - 0.02, M.carcass, cx, UPPER_BOTTOM + UH / 2, (UPPER_D - 0.02) / 2);
    doorSet(g, cx, u.w, UPPER_BOTTOM + 0.003, K.H - 0.003, UPPER_BOTTOM + 0.12, UPPER_BOTTOM + 0.018, UPPER_D);
  };
  const makeRun = (lower, uppers, len) => {
    const g = new THREE.Group();
    let x = 0;
    lower.forEach(m => { lowerModule(g, m, x); x += m.w; });
    put(g, len, PLINTH, D - 0.05, M.plinth, len / 2, PLINTH / 2, (D - 0.05) / 2);
    if (K.uppers) uppers.forEach(u => upperModule(g, u));
    return g;
  };

  /* Основная линия вдоль задней стены */
  const x0 = K.layout === 'straight' ? -K.W / 2 : -RW / 2;
  let cursor = 0;
  const upBack = [];
  kitchenRects = [];
  K.modules.forEach(m => {
    const full = FULL_TYPES.has(m.type);
    if (!full) upBack.push({ x: cursor, w: m.w, hood: m.type === 'hob' });
    kitchenRects.push({ x: x0 + cursor + m.w / 2, z: -RD / 2 + D / 2, w: m.w, d: D, h: full || K.uppers ? K.H : TOP_Y });
    cursor += m.w;
  });
  const back = makeRun(K.modules, upBack, K.W);
  back.position.set(x0, 0, -RD / 2);
  cabinetGroup.add(back);

  /* Боковые линии: Г- и П-образная планировки заполняются типовыми модулями */
  if (K.layout !== 'straight') {
    const sideLen = K.side - D;
    const lowerSide = fillRun(sideLen).map((p, i) => ({ w: p.w, type: i % 2 === 1 ? 'drawers' : 'base' }));
    const UL = K.side - UPPER_D;
    const upperSide = offset => { let x = offset; return fillRun(UL).map(p => { const u = { x, w: p.w }; x += p.w; return u; }); };
    const left = makeRun(lowerSide, upperSide(0), sideLen);
    left.rotation.y = Math.PI / 2;
    left.position.set(-RW / 2, 0, -RD / 2 + K.side);
    cabinetGroup.add(left);
    put(cabinetGroup, 0.012, UPPER_BOTTOM - TOP_Y, D, M.apron, -RW / 2 + 0.006, (UPPER_BOTTOM + TOP_Y) / 2, -RD / 2 + D / 2); /* угол: фартук на боковой стене */
    if (K.layout === 'u') {
      const right = makeRun(lowerSide, upperSide(-(D - UPPER_D)), sideLen);
      right.rotation.y = -Math.PI / 2;
      right.position.set(RW / 2, 0, -RD / 2 + D);
      cabinetGroup.add(right);
      put(cabinetGroup, 0.012, UPPER_BOTTOM - TOP_Y, D, M.apron, RW / 2 - 0.006, (UPPER_BOTTOM + TOP_Y) / 2, -RD / 2 + D / 2);
    }
  }
}

function applyShift(state) {
  const kitchen = state.product === 'kitchen';
  const s = clamp(Number(kitchen ? state.kitchen?.shift : state.shift) || 0, -1, 1);
  let free = 0;
  if (kitchen) { const K = getKitchen(state); free = K.layout === 'straight' ? Math.max(0, (roomSize.w - K.W) / 2 - 0.02) : 0; }
  else free = Math.max(0, (roomSize.w - getDims(state).W) / 2 - 0.03);
  cabinetGroup.position.x = s * free;
}

/* Подсветка выбранного модуля (только в режимах «Композиция» и «Детали») */
const highlight = new THREE.Group();
highlight.add(
  new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.2, depthWrite: false })),
  new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xffd24a }))
);
highlight.visible = false;
scene.add(highlight);
function updateHighlight(state) {
  const show = state.product === 'kitchen' && state.editorMode !== '3d' && kitchenRects.length;
  const r = show ? kitchenRects[Math.min(Number(state.kitchen?.selected) || 0, kitchenRects.length - 1)] : null;
  highlight.visible = !!r;
  if (r) { highlight.scale.set(r.w, r.h, r.d); highlight.position.set(r.x + cabinetGroup.position.x, r.h / 2, r.z); }
}

/* ---------- Камера ---------- */
let focus = { w: 3.4, h: 2.6, depth: 1.2 };
function setFocus(state) {
  if (state.product === 'kitchen') {
    const K = getKitchen(state);
    const wide = K.layout === 'straight' ? K.W : Math.max(K.W, K.side + 0.6);
    focus = { w: wide + 0.5, h: K.H + 0.35, depth: (roomSize.d / 2 - K.D) * (K.layout === 'straight' ? 0.9 : 0.55) };
  } else {
    const { W, H, D } = getDims(state);
    focus = { w: W + 0.7, h: H + 0.35, depth: (roomSize.d / 2 - D) * 0.9 };
  }
  target.set(0, focus.h / 2 - 0.02, 0);
}
function fit() {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const needV = (focus.h * 1.06) / (2 * Math.tan(vFov / 2));
  const needH = (focus.w * 1.06) / (2 * Math.tan(hFov / 2));
  fitDistance = Math.max(2.6, needV, needH) + focus.depth;
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
  const kit = state.kitchen ? { ...state.kitchen, selected: 0, shift: 0 } : null;
  const sig = JSON.stringify([state.product, kit, state.doorsOpen, state.decor, state.dimensions, state.sections, state.hardware, state.furnitureColor, state.wallColor, state.wallType, state.floorColor, state.floorType]);
  if (sig !== builtSig) {
    builtSig = sig;
    const dims = getDims(state);
    buildRoom(state, dims);
    if (state.product === 'kitchen') buildKitchen(state); else { kitchenRects = []; buildModel(state, dims); }
    setFocus(state);
    fit();
    renderer.shadowMap.needsUpdate = true;
  }
  const lsig = state.lightType + ':' + state.lightStrength;
  if (lsig !== lightSig) { lightSig = lsig; updateLights(state); }
  const prevX = cabinetGroup.position.x;
  applyShift(state);
  if (Math.abs(prevX - cabinetGroup.position.x) > 1e-6) renderer.shadowMap.needsUpdate = true;
  updateHighlight(state);
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
