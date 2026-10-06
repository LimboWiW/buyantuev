/* Процедурные текстуры материалов + каталог декоров.
   Рисуются прямо в браузере (без загрузки картинок): серые карты «альбедо», которые затем
   умножаются на цвет декора. Все карты бесшовные. Названия и коды декоров — из базы
   материалов Bazis (Egger). Чтобы подставить настоящие фото, укажите у декора поле image: "путь.jpg". */
(function () {
  'use strict';

  /* ---------- Бесшовный value-noise ---------- */
  function hash(ix, iy, seed) {
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed + 1, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function makeNoise(seed) {
    return function (x, y, px, py) {
      const x0 = Math.floor(x), y0 = Math.floor(y);
      const fx = x - x0, fy = y - y0;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const X0 = ((x0 % px) + px) % px, X1 = (X0 + 1) % px;
      const Y0 = ((y0 % py) + py) % py, Y1 = (Y0 + 1) % py;
      const a = hash(X0, Y0, seed), b = hash(X1, Y0, seed), c = hash(X0, Y1, seed), d = hash(X1, Y1, seed);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
  }
  function fbm(n, x, y, px, py, oct) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * n(x * f, y * f, px * f, py * f);
      norm += amp; amp *= 0.5; f *= 2;
    }
    return sum / norm;
  }
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

  /* ---------- Рисование попиксельно ---------- */
  function paint(size, fn) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const img = g.createImageData(size, size);
    const data = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const v = clamp01(fn(x / size, y / size, x, y)) * 255 | 0;
        const i = (y * size + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  /* ---------- Дерево: годовые кольца, волокна, поры ---------- */
  function woodValue(n, u, v, o) {
    /* u — поперёк волокон, v — вдоль волокон (оба 0..1 и бесшовные). Линии почти прямые, с мягкой волной */
    const warp = (fbm(n, u * 2, v, 2, 1, 3) - 0.5) * o.warp;
    const t = u * o.rings + warp;
    const band = Math.pow((Math.sin(t * 6.28318) + 1) / 2, o.sharp);
    const streak = n(u * 140, v * 2, 140, 2);
    const streak2 = n(u * 44 + 3, v, 44, 1);
    const pore = n(u * 160 + 7, v * 30, 160, 30) > o.poreCut ? o.poreDark : 1;
    return o.base * (1 - o.contrast * band) * (0.88 + 0.16 * streak) * (0.92 + 0.1 * streak2) * pore;
  }
  const WOODS = {
    oak:    { rings: 12, warp: 0.9, sharp: 1.8, contrast: 0.2,  base: 1.04, poreCut: 0.82, poreDark: 0.9 },
    walnut: { rings: 9,  warp: 1.5, sharp: 1.4, contrast: 0.3,  base: 1.1,  poreCut: 0.85, poreDark: 0.9 },
    ash:    { rings: 16, warp: 0.6, sharp: 2.2, contrast: 0.12, base: 1.03, poreCut: 0.8,  poreDark: 0.92 }
  };
  function wood(size, kind, seed, vertical) {
    const o = WOODS[kind] || WOODS.oak, n = makeNoise(seed);
    return paint(size, (u, v) => vertical ? woodValue(n, u, v, o) : woodValue(n, v, u, o));
  }

  /* ---------- Доски пола (дерево/ламинат) ---------- */
  function planks(size, kind, seed) {
    const o = Object.assign({}, WOODS[kind === 'laminate' ? 'ash' : 'oak']);
    const n = makeNoise(seed);
    const rows = 10, rowH = size / rows, plankLen = size / 2;
    return paint(size, (u, v, x, y) => {
      const row = Math.floor(y / rowH);
      const shift = hash(row, 5, seed) * size;
      const xx = (x + shift) % size;
      const col = Math.floor(xx / plankLen);
      const id = row * 2 + col;
      const lx = (xx % plankLen) / plankLen, ly = (y % rowH) / rowH;
      let val = woodValue(n, (ly + hash(id, 9, seed)) % 1 * 0.999, (lx * 0.5 + hash(id, 3, seed)) % 1 * 0.999, o);
      val *= 0.9 + 0.1 * hash(id, 1, seed);
      const seamY = y % rowH, seamX = xx % plankLen;
      if (seamY < 1.6 || seamX < 1.6) val *= kind === 'laminate' ? 0.6 : 0.5;
      return val;
    });
  }

  /* ---------- Прочее ---------- */
  function plain(size, seed) {
    const n = makeNoise(seed);
    return paint(size, (u, v, x, y) => 0.965 + 0.03 * n(x / 3, y / 3, size / 3, size / 3) + 0.012 * hash(x, y, seed));
  }
  function plaster(size, seed) {
    const n = makeNoise(seed);
    return paint(size, (u, v) => 0.95 + 0.07 * fbm(n, u * 4, v * 4, 4, 4, 4) + 0.015 * n(u * 128, v * 128, 128, 128));
  }
  function concrete(size, seed) {
    const n = makeNoise(seed);
    return paint(size, (u, v, x, y) => {
      const cloud = fbm(n, u * 3, v * 3, 3, 3, 5);
      const pit = n(u * 96, v * 96, 96, 96) > 0.86 ? 0.82 : 1;
      return (0.78 + 0.3 * cloud) * pit * (0.97 + 0.04 * hash(x, y, seed));
    });
  }
  function marble(size, seed) {
    const n = makeNoise(seed);
    return paint(size, (u, v) => {
      const cloud = fbm(n, u * 2, v * 2, 2, 2, 4);
      const w = fbm(n, u * 3 + 5, v * 3 + 1, 3, 3, 4);
      const vein = Math.pow(1 - Math.abs(2 * w - 1), 9);
      const fine = Math.pow(1 - Math.abs(2 * fbm(n, u * 6 + 2, v * 6 + 9, 6, 6, 3) - 1), 14);
      return 0.97 - 0.07 * cloud - 0.38 * vein - 0.14 * fine;
    });
  }
  function stone(size, seed) {
    const n = makeNoise(seed);
    return paint(size, (u, v, x, y) => 0.88 + 0.08 * n(x / 2, y / 2, size / 2, size / 2) + 0.06 * hash(x, y, seed));
  }
  function tile(size, seed) {
    const n = makeNoise(seed), cells = 4, cs = size / cells;
    return paint(size, (u, v, x, y) => {
      const cx = Math.floor(x / cs), cy = Math.floor(y / cs);
      const lx = x % cs, ly = y % cs;
      const grout = lx < 1.8 || ly < 1.8;
      const tone = 0.9 + 0.08 * hash(cx, cy, seed);
      const speck = 0.9 + 0.12 * n(x / 2, y / 2, size / 2, size / 2) * (0.6 + 0.4 * fbm(n, u * 4, v * 4, 4, 4, 2));
      return grout ? 0.62 : tone * speck;
    });
  }
  function carpet(size, seed) {
    const n = makeNoise(seed);
    return paint(size, (u, v, x, y) => 0.82 + 0.1 * n(x * 0.9, y * 0.9, size * 0.9 | 0, size * 0.9 | 0) + 0.1 * hash(x, y, seed) + 0.04 * Math.sin(y * 0.8));
  }
  function wallpaper(size, seed) {
    const n = makeNoise(seed), step = size / 8;
    return paint(size, (u, v, x, y) => {
      let val = 0.965 + 0.02 * n(x / 2, y / 2, size / 2, size / 2);
      const row = Math.floor(y / step), cx = (x - (row % 2) * step / 2 + size) % step - step / 2, cy = (y % step) - step / 2;
      const d = Math.hypot(cx, cy);
      if (d < 3.2) val -= 0.14 * (1 - d / 3.2);
      if ((x % (size / 4)) < 1.2) val -= 0.04;
      return val;
    });
  }

  const MAKERS = {
    oak: (s, seed, o) => wood(s, 'oak', seed, o.vertical !== false),
    walnut: (s, seed, o) => wood(s, 'walnut', seed, o.vertical !== false),
    ash: (s, seed, o) => wood(s, 'ash', seed, o.vertical !== false),
    planks: (s, seed) => planks(s, 'wood', seed),
    laminate: (s, seed) => planks(s, 'laminate', seed),
    plain: (s, seed) => plain(s, seed),
    plaster: (s, seed) => plaster(s, seed),
    concrete: (s, seed) => concrete(s, seed),
    marble: (s, seed) => marble(s, seed),
    stone: (s, seed) => stone(s, seed),
    tile: (s, seed) => tile(s, seed),
    carpet: (s, seed) => carpet(s, seed),
    wallpaper: (s, seed) => wallpaper(s, seed)
  };
  const cache = new Map();
  function canvas(kind, size, opts) {
    opts = opts || {};
    const key = kind + ':' + size + ':' + (opts.seed || 7) + ':' + (opts.vertical === false ? 'h' : 'v');
    if (cache.has(key)) return cache.get(key);
    const make = MAKERS[kind] || MAKERS.plain;
    const c = make(size, opts.seed || 7, opts);
    cache.set(key, c);
    return c;
  }
  /* Превью для кружков выбора: серая карта × цвет */
  function dataURL(kind, size, tint, opts) {
    const src = canvas(kind, size, opts);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = tint || '#ffffff';
    g.fillRect(0, 0, size, size);
    return c.toDataURL('image/jpeg', 0.82);
  }

  /* ---------- Каталог декоров (названия и коды — из базы материалов Bazis) ---------- */
  const DECORS = [
    { id: 'w980', name: 'Белый платиновый', code: 'W980', kind: 'plain', tint: '#f3f2ee' },
    { id: 'u708', name: 'Светло-серый', code: 'U708', kind: 'plain', tint: '#c6c4bf' },
    { id: 'u961', name: 'Чёрный графит', code: 'U961', kind: 'plain', tint: '#404244' },
    { id: 'h1145', name: 'Дуб Бардолино натуральный', code: 'H1145', kind: 'oak', tint: '#d3b289' },
    { id: 'h1146', name: 'Дуб Бардолино серый', code: 'H1146', kind: 'oak', tint: '#ada597' },
    { id: 'h1334', name: 'Дуб Сорано натуральный светлый', code: 'H1334', kind: 'oak', tint: '#dcc29f' },
    { id: 'h3170', name: 'Дуб Кендал натуральный', code: 'H3170', kind: 'oak', tint: '#bd9262' },
    { id: 'h3700', name: 'Орех Пацифик натуральный', code: 'H3700', kind: 'walnut', tint: '#a97a50' },
    { id: 'h3704', name: 'Орех Аида табак', code: 'H3704', kind: 'walnut', tint: '#835a3b' },
    { id: 'h1215', name: 'Ясень Кассино', code: 'H1215', kind: 'ash', tint: '#cdbea6' },
    { id: 'f186', name: 'Бетон Чикаго светло-серый', code: 'F186', kind: 'concrete', tint: '#bab9b6' },
    { id: 'f187', name: 'Бетон Чикаго тёмно-серый', code: 'F187', kind: 'concrete', tint: '#77787a' }
  ];

  window.BTex = { canvas: canvas, dataURL: dataURL, kinds: Object.keys(MAKERS) };
  window.DECORS = DECORS;
})();
