
    /* Все данные каталога находятся здесь — сайт работает без БД и внешних интеграций. */
    const catalog = {
      wardrobe: { name: "Шкаф распашной · пример", className: "furniture--wardrobe", rate: 23990 * 1.12, defaultDimensions: { width: 1200, height: 2400, depth: 600 } },
      kitchen: { name: "Кухня · пример", defaultDimensions: { width: 3200, height: 2300, depth: 600 } }
    };
    /* Базовый ориентир рынка Улан‑Удэ: шкафы от 23 990 ₽/п.м.; заложена поправка 12% на 2026 год. */
    const furnitureColors = [
      { id: "natural", label: "Дуб натуральный", hex: "#b48a64", extra: 0, dark: "#805a3e" },
      { id: "white", label: "Белый", hex: "#f2efe7", extra: 0.02, dark: "#bdb8aa" },
      { id: "black", label: "Чёрный", hex: "#222222", extra: 0.08, dark: "#090909" },
      { id: "graphite", label: "Графит", hex: "#515956", extra: 0.07, dark: "#303734" },
      { id: "grey", label: "Серый", hex: "#9da09b", extra: 0.04, dark: "#6b6d69" },
      { id: "walnut", label: "Орех", hex: "#6d4937", extra: 0.1, dark: "#432a20" },
      { id: "oak", label: "Дуб сонома", hex: "#c49a6c", extra: 0.04, dark: "#8e6642" },
      { id: "ash", label: "Ясень", hex: "#d6c9b1", extra: 0.05, dark: "#9b8d76" },
      { id: "beige", label: "Бежевый", hex: "#d8c9b5", extra: 0.04, dark: "#a58e74" },
      { id: "cream", label: "Кремовый", hex: "#e9dfc7", extra: 0.04, dark: "#bcae8f" },
      { id: "red", label: "Красный", hex: "#c33e36", extra: 0.1, dark: "#7e211e" },
      { id: "coral", label: "Коралловый", hex: "#f04923", extra: 0.1, dark: "#a82c16" },
      { id: "orange", label: "Оранжевый", hex: "#dc762c", extra: 0.1, dark: "#994617" },
      { id: "yellow", label: "Жёлтый", hex: "#e4bd43", extra: 0.08, dark: "#9c7a1b" },
      { id: "mustard", label: "Горчичный", hex: "#bb9b3d", extra: 0.08, dark: "#80671e" },
      { id: "green", label: "Зелёный", hex: "#4e765c", extra: 0.1, dark: "#2f4b3a" },
      { id: "sage", label: "Шалфей", hex: "#829889", extra: 0.08, dark: "#52695a" },
      { id: "mint", label: "Мятный", hex: "#9fc7b0", extra: 0.1, dark: "#5c8c73" },
      { id: "blue", label: "Синий", hex: "#3b608b", extra: 0.1, dark: "#233a5b" },
      { id: "navy", label: "Тёмно-синий", hex: "#243753", extra: 0.12, dark: "#101c2d" },
      { id: "sky", label: "Голубой", hex: "#91b9c7", extra: 0.08, dark: "#5b8797" },
      { id: "purple", label: "Фиолетовый", hex: "#765b85", extra: 0.12, dark: "#473650" },
      { id: "pink", label: "Розовый", hex: "#d596a0", extra: 0.1, dark: "#945b66" },
      { id: "terracotta", label: "Терракота", hex: "#a95d47", extra: 0.1, dark: "#713829" },
      { id: "scarlet", label: "Алый", hex: "#ed2939", extra: 0.12, dark: "#981b25" },
      { id: "vermilion", label: "Киноварь", hex: "#e34234", extra: 0.12, dark: "#94251d" },
      { id: "amber", label: "Янтарный", hex: "#ffbf00", extra: 0.1, dark: "#9b7200" },
      { id: "lemon", label: "Лимонный", hex: "#f4e51c", extra: 0.1, dark: "#9e9700" },
      { id: "chartreuse", label: "Шартрез", hex: "#7fff00", extra: 0.1, dark: "#4d9900" },
      { id: "emerald", label: "Изумрудный", hex: "#009b77", extra: 0.12, dark: "#005c47" },
      { id: "turquoise", label: "Бирюзовый", hex: "#30d5c8", extra: 0.12, dark: "#16847c" },
      { id: "azure", label: "Лазурный", hex: "#007fff", extra: 0.12, dark: "#005099" },
      { id: "violet", label: "Фиолетово-синий", hex: "#5b2c83", extra: 0.14, dark: "#351a4d" },
      { id: "magenta", label: "Пурпурный", hex: "#d00080", extra: 0.14, dark: "#790049" }
    ];
    const wallColors = [
      { id: "sand", label: "Песочный", hex: "#e6ded3" }, { id: "mist", label: "Серо-зелёный", hex: "#cbd7d1" }, { id: "blush", label: "Пыльная роза", hex: "#d9c5bf" }, { id: "cream", label: "Сливочный", hex: "#eee8d8" },
      { id: "white", label: "Белый", hex: "#f4f1e9" }, { id: "stone", label: "Каменный", hex: "#bebbb1" }, { id: "taupe", label: "Тауп", hex: "#b5a79c" }, { id: "peach", label: "Персиковый", hex: "#e8c0a9" },
      { id: "red", label: "Красный", hex: "#d29b93" }, { id: "orange", label: "Абрикос", hex: "#e5b78f" }, { id: "yellow", label: "Солнечный", hex: "#eadcaa" }, { id: "mustard", label: "Горчичный", hex: "#d3c28b" },
      { id: "green", label: "Шалфей", hex: "#b7c6b3" }, { id: "mint", label: "Мятный", hex: "#c1d9c9" }, { id: "teal", label: "Бирюзовый", hex: "#a7cbc5" }, { id: "blue", label: "Голубой", hex: "#c2d3d9" },
      { id: "sky", label: "Небесный", hex: "#aec8df" }, { id: "navy", label: "Сине-серый", hex: "#9caebd" }, { id: "purple", label: "Лавандовый", hex: "#c5b5cf" }, { id: "pink", label: "Розовый", hex: "#e0b3bd" },
      { id: "terracotta", label: "Терракота", hex: "#d29c85" }, { id: "olive", label: "Оливковый", hex: "#b9b991" }, { id: "charcoal", label: "Графитовый", hex: "#81857f" }, { id: "black", label: "Чёрный", hex: "#555755" },
      { id: "scarlet", label: "Алый", hex: "#ef9b9f" }, { id: "vermilion", label: "Киноварь", hex: "#efa28e" }, { id: "amber", label: "Янтарный", hex: "#f1c777" }, { id: "lemon", label: "Лимонный", hex: "#f2ed9c" },
      { id: "chartreuse", label: "Шартрез", hex: "#d2e9a0" }, { id: "emerald", label: "Изумрудный", hex: "#9ed2b7" }, { id: "turquoise", label: "Бирюзовый", hex: "#9ed9d2" }, { id: "azure", label: "Лазурный", hex: "#9fcbe8" },
      { id: "violet", label: "Фиолетово-синий", hex: "#b9a8d1" }, { id: "magenta", label: "Пурпурный", hex: "#dda6c7" }, { id: "coral", label: "Коралловый", hex: "#efaa99" }, { id: "lime", label: "Лаймовый", hex: "#cfe19b" }
    ];
    const floorColors = [
      { id: "oak", label: "Светлый дуб", hex: "#c8a078" }, { id: "natural", label: "Натуральная доска", hex: "#a97b54" }, { id: "walnut", label: "Орех", hex: "#6f4b35" }, { id: "ash", label: "Ясень", hex: "#d2c1a9" },
      { id: "white", label: "Белёный", hex: "#e5dfd1" }, { id: "grey", label: "Серый", hex: "#8f918b" }, { id: "graphite", label: "Графит", hex: "#444745" }, { id: "beige", label: "Бежевый", hex: "#c8b49a" },
      { id: "red", label: "Красноватый", hex: "#9c5d48" }, { id: "orange", label: "Медовый", hex: "#bc7541" }, { id: "yellow", label: "Соломенный", hex: "#d1ad5e" }, { id: "green", label: "Зелёный", hex: "#70816d" },
      { id: "mint", label: "Мятный", hex: "#9bb8aa" }, { id: "blue", label: "Синий", hex: "#617b8d" }, { id: "navy", label: "Тёмно-синий", hex: "#354655" }, { id: "purple", label: "Сливовый", hex: "#6e5b6b" },
      { id: "pink", label: "Пыльно-розовый", hex: "#b98d8e" }, { id: "terracotta", label: "Терракота", hex: "#ad6e52" }, { id: "sand", label: "Песочный", hex: "#d2bc9a" }, { id: "concrete", label: "Бетон", hex: "#a4a39d" },
      { id: "marble", label: "Мрамор", hex: "#d9d5ca" }, { id: "black", label: "Чёрный камень", hex: "#343534" }, { id: "honey", label: "Мёд", hex: "#b8823f" }, { id: "smoke", label: "Дымчатый", hex: "#777775" },
      { id: "scarlet", label: "Алый", hex: "#9f4c48" }, { id: "vermilion", label: "Киноварь", hex: "#a8573f" }, { id: "amber", label: "Янтарный", hex: "#c6933e" }, { id: "lemon", label: "Лимонный", hex: "#c8bc58" },
      { id: "chartreuse", label: "Шартрез", hex: "#82964e" }, { id: "emerald", label: "Изумрудный", hex: "#397c67" }, { id: "turquoise", label: "Бирюзовый", hex: "#4d9692" }, { id: "azure", label: "Лазурный", hex: "#4e7998" },
      { id: "violet", label: "Фиолетово-синий", hex: "#5f5273" }, { id: "magenta", label: "Пурпурный", hex: "#925271" }, { id: "coral", label: "Коралловый", hex: "#ae6655" }, { id: "lime", label: "Лаймовый", hex: "#899b4f" }
    ];
    const unifiedColors = [...[...furnitureColors, ...wallColors, ...floorColors].reduce((map, color) => map.has(color.id) ? map : map.set(color.id, color), new Map()).values()];
    const materials = {
      ldsp: { name: "ЛДСП стандарт", multiplier: 1 },
      egger: { name: "ЛДСП Egger", multiplier: 1.16 },
      mdf: { name: "МДФ в плёнке", multiplier: 1.29 },
      enamel: { name: "МДФ эмаль матовая", multiplier: 1.42 },
      veneer: { name: "Шпон натуральный", multiplier: 1.56 }
    };
    const defaultSections = [
      { id: 1, width: 600, shelves: 3, drawers: 0, facade: "door" },
      { id: 2, width: 600, shelves: 1, drawers: 0, rod: true, facade: "door" }
    ];
    const hardware = { handles: { basic: { name: "Базовые, чёрные", price: 0 }, profile: { name: "Профиль Gola", price: 6500 }, brass: { name: "Латунные", price: 4800 }, soft: { name: "Минималистичные", price: 2800 } }, hinges: { standard: { name: "Стандартные", price: 0 }, softclose: { name: "С доводчиком", price: 4200 }, premium: { name: "Премиум с доводчиком", price: 7900 } } };
    const defaultState = { product: "wardrobe", material: "ldsp", furnitureColor: "natural", decor: "h1145", shift: 0, doorsOpen: false, wallColor: "sand", wallType: "paint", floorColor: "oak", floorType: "laminate", lightType: "warm", lightStrength: 65, editorMode: "3d", selectedSection: 0, nextSectionId: 3, camera: { x: 0, y: 0, zoom: 1 }, hardware: { handles: "basic", hinges: "standard" }, sections: defaultSections, dimensions: { ...catalog.wardrobe.defaultDimensions } };
    let state = (() => { try { const saved = JSON.parse(localStorage.getItem("buyantuev-editor-v1")); return saved ? { ...defaultState, ...saved, hardware: { ...defaultState.hardware, ...(saved.hardware || {}) }, camera: { ...defaultState.camera, ...(saved.camera || {}) }, dimensions: { ...defaultState.dimensions, ...(saved.dimensions || {}) }, sections: Array.isArray(saved.sections) && saved.sections.length ? saved.sections : defaultSections.map(section => ({ ...section })) } : { ...defaultState, sections: defaultSections.map(section => ({ ...section })) }; } catch (error) { return { ...defaultState, sections: defaultSections.map(section => ({ ...section })) }; } })();

    delete state.mezzanine; delete state.corner; /* чистим старые сохранения из localStorage */
    const handleSelect = document.getElementById("handleSelect");
    const hingeSelect = document.getElementById("hingeSelect");
    const roomWall = document.getElementById("roomWall");
    const roomFloor = document.getElementById("roomFloor");
    const materialSelect = document.getElementById("materialSelect");
    const priceValue = document.getElementById("priceValue");
    const priceDetails = document.getElementById("priceDetails");
    const sceneCaption = document.getElementById("sceneCaption");
    const dimensionInputs = { width: document.getElementById("widthInput"), height: document.getElementById("heightInput"), depth: document.getElementById("depthInput") };

    function rubles(amount) { return new Intl.NumberFormat("ru-RU").format(amount) + " ₽"; }
    function renderWardrobeControls() {
      const list = document.getElementById("sectionList");
      list.innerHTML = state.sections.map((section, index) => '<button type="button" class="section-tab ' + (index === state.selectedSection ? "active" : "") + '" data-section-index="' + index + '">Секция ' + (index + 1) + '</button>').join("");
      const section = state.sections[state.selectedSection];
      document.getElementById("sectionSettings").innerHTML = '<label class="editor-field">Ширина, мм<input class="editor-number" id="sectionWidth" type="number" min="250" max="2000" step="50" value="' + section.width + '"></label><label class="editor-field">Полки<input class="editor-number" id="sectionShelves" type="number" min="0" max="8" step="1" value="' + section.shelves + '"></label><label class="editor-field">Ящики<input class="editor-number" id="sectionDrawers" type="number" min="0" max="6" step="1" value="' + (section.drawers || 0) + '"></label><label class="editor-field">Штанга<select class="editor-select" id="sectionRod"><option value="0"' + (section.rod ? "" : " selected") + '>Нет</option><option value="1"' + (section.rod ? " selected" : "") + '>Есть</option></select></label><label class="editor-field">Фасад<select class="editor-select" id="sectionFacade"><option value="door" ' + (section.facade === "door" ? "selected" : "") + '>Дверь</option><option value="open" ' + (section.facade === "open" ? "selected" : "") + '>Открытая</option><option value="glass" ' + (section.facade === "glass" ? "selected" : "") + '>Стекло</option></select></label>';
      document.querySelectorAll("[data-mode]").forEach(button => button.classList.toggle("active", button.dataset.mode === state.editorMode));
    }
    /* ====== Кухня ======
       ВАЖНО: цены ниже — ориентировочные заготовки. Подставьте свои расценки за погонный метр. */
    const KITCHEN_RATES = { lower: 21000, upper: 11500, minTotal: 80000, hardwareFactor: 2 };
    const kitchenTypes = {
      base: { name: "Шкаф с дверцами", k: 1 },
      drawers: { name: "Ящики", k: 1.25 },
      sink: { name: "Мойка", k: 1.1 },
      hob: { name: "Варочная панель", k: 1.05 },
      oven: { name: "Духовой шкаф", k: 1.35 },
      tall: { name: "Пенал", k: 1.9 },
      fridge: { name: "Холодильник (ниша)", k: 0.6 }
    };
    const kitchenCounters = {
      laminate: { name: "Пластик под дерево", price: 4800 },
      white: { name: "Камень белый", price: 12500 },
      graphite: { name: "Графит", price: 9800 },
      marble: { name: "Мрамор", price: 16500 },
      oakwood: { name: "Массив дуба", price: 11000 },
      concrete: { name: "Бетон", price: 8500 },
      granite: { name: "Чёрный гранит", price: 15000 },
      quartz: { name: "Кварц бежевый", price: 13500 },
      walnut: { name: "Орех (шпон)", price: 9000 }
    };
    const kitchenLayouts = { straight: "Прямая", l: "Угловая", u: "П-образная" };
    const kitchenFull = new Set(["tall", "fridge"]);
    function freshKitchen() {
      return {
        layout: "l", side: 2000, uppers: true, shift: 0, counter: "laminate", selected: 0, nextId: 6,
        dimensions: { width: 3200, height: 2300, depth: 600 },
        modules: [
          { id: 1, width: 600, type: "base" }, { id: 2, width: 800, type: "sink" }, { id: 3, width: 600, type: "drawers", drawers: 3 },
          { id: 4, width: 600, type: "hob" }, { id: 5, width: 600, type: "fridge" }
        ]
      };
    }
    function normalizeKitchen(saved) {
      const base = freshKitchen(), k = { ...base, ...(saved || {}) };
      k.dimensions = { ...base.dimensions, ...((saved && saved.dimensions) || {}) };
      k.modules = saved && Array.isArray(saved.modules) && saved.modules.length ? saved.modules : base.modules;
      if (!kitchenLayouts[k.layout]) k.layout = "l";
      if (!kitchenCounters[k.counter]) k.counter = "laminate";
      k.modules = k.modules.slice(0, 10).map((m, i) => ({ id: Number(m.id) || i + 1, width: Math.min(1200, Math.max(300, Number(m.width) || 600)), type: kitchenTypes[m.type] ? m.type : "base", drawers: Math.min(4, Math.max(0, Math.round(Number(m.drawers) || 0))) }));
      k.nextId = Math.max(Number(k.nextId) || 0, ...k.modules.map(m => m.id + 1));
      k.side = Math.min(3600, Math.max(1200, Number(k.side) || 2000)); k.uppers = k.uppers !== false; k.shift = Math.min(1, Math.max(-1, Number(k.shift) || 0));
      k.selected = Math.min(Math.max(0, Number(k.selected) || 0), k.modules.length - 1);
      return k;
    }
    state.kitchen = normalizeKitchen(state.kitchen);
    function sanitizeState() {
      /* Сохранённый проект из localStorage мог быть изменён вручную — приводим к допустимым значениям */
      const num = (v, d, lo, hi) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
      const okId = (id, d) => unifiedColors.some(c => c.id === id) ? id : d;
      state.furnitureColor = okId(state.furnitureColor, "natural");
      if (state.wallColor !== undefined) state.wallColor = okId(state.wallColor, defaultState.wallColor);
      if (state.floorColor !== undefined) state.floorColor = okId(state.floorColor, defaultState.floorColor);
      if (!materials[state.material]) state.material = defaultState.material;
      if (!["paint", "wallpaper", "tile", "brick", "concrete"].includes(state.wallType)) state.wallType = defaultState.wallType;
      if (!["laminate", "tile", "carpet", "wood", "parquet", "concrete"].includes(state.floorType)) state.floorType = defaultState.floorType;
      if (!["warm", "neutral", "cool"].includes(state.lightType)) state.lightType = defaultState.lightType;
      state.lightStrength = num(state.lightStrength, 65, 0, 100);
      state.shift = num(state.shift, 0, -1, 1);
      state.doorsOpen = state.doorsOpen === true;
      if (state.decor !== "none" && !(window.DECORS || []).some(d => d.id === state.decor)) state.decor = "none";
      state.hardware = { ...defaultState.hardware, ...(state.hardware || {}) };
      if (!hardware.handles[state.hardware.handles]) state.hardware.handles = defaultState.hardware.handles;
      if (!hardware.hinges[state.hardware.hinges]) state.hardware.hinges = defaultState.hardware.hinges;
      state.dimensions = { ...catalog.wardrobe.defaultDimensions, ...(state.dimensions || {}) };
      ["width", "height", "depth"].forEach(key => { state.dimensions[key] = num(state.dimensions[key], catalog.wardrobe.defaultDimensions[key], 100, 7000); });
      if (Array.isArray(state.sections) && state.sections.length) {
        state.sections = state.sections.slice(0, 8).map((s, i) => ({ id: num(s && s.id, i + 1, 0, 99999), width: num(s && s.width, 500, 250, 1500), shelves: Math.round(num(s && s.shelves, 2, 0, 8)), drawers: Math.round(num(s && s.drawers, 0, 0, 6)), rod: !!(s && s.rod), facade: ["door", "open", "glass"].includes(s && s.facade) ? s.facade : "door" }));
      } else state.sections = defaultSections.map(section => ({ ...section }));
      state.selectedSection = Math.min(state.sections.length - 1, Math.max(0, Math.round(num(state.selectedSection, 0, 0, 50))));
    }
    sanitizeState();
    if (!catalog[state.product]) state.product = "wardrobe";
    function syncKitchenWidth() { state.kitchen.dimensions.width = state.kitchen.modules.reduce((sum, m) => sum + Number(m.width), 0); }
    syncKitchenWidth();
    function curDims() { return state.product === "kitchen" ? state.kitchen.dimensions : state.dimensions; }
    function dimLimits(key) {
      if (state.product === "kitchen") return { width: [state.kitchen.layout === "u" ? 2400 : 1200, 6000], height: [2000, 2700], depth: [500, 700] }[key];
      return { width: [600, 4000], height: [700, 3000], depth: [300, 800] }[key];
    }
    function kitchenInfo(furnitureColor, material, kOverride) {
      const k = kOverride || state.kitchen, d = k.dimensions, D = d.depth;
      const sideCount = k.layout === "straight" ? 0 : k.layout === "u" ? 2 : 1;
      const backLen = k.modules.reduce((s, m) => s + m.width, 0) / 1000;
      const sideLen = Math.max(0, k.side - D) / 1000 * sideCount;
      const open = k.modules.filter(m => !kitchenFull.has(m.type)).reduce((s, m) => s + m.width, 0) / 1000;
      const weighted = k.modules.reduce((s, m) => s + m.width / 1000 * (kitchenTypes[m.type] || kitchenTypes.base).k, 0) + k.modules.reduce((s, m) => s + (m.type === "base" ? (Number(m.drawers) || 0) * m.width / 1000 * 0.08 : 0), 0) + sideLen * 1.05;
      const upperLen = k.uppers ? open + Math.max(0, k.side - 320) / 1000 * sideCount : 0;
      const colorMultiplier = 1 + (furnitureColor.extra || 0);
      const heightFactor = Math.max(0.5, (d.height - 1450) / 850);
      const body = (weighted * KITCHEN_RATES.lower * (0.85 + 0.15 * D / 600) + upperLen * KITCHEN_RATES.upper * heightFactor) * material.multiplier * colorMultiplier;
      const counter = (open + sideLen) * kitchenCounters[k.counter].price;
      const hw = (hardware.handles[state.hardware.handles].price + hardware.hinges[state.hardware.hinges].price) * KITCHEN_RATES.hardwareFactor;
      const total = Math.max(KITCHEN_RATES.minTotal, Math.round((body + counter + hw) / 100) * 100);
      const lengthText = k.layout === "straight" ? backLen.toFixed(1) + " м" : backLen.toFixed(1) + " + " + (k.side / 1000).toFixed(1) + (k.layout === "u" ? " × 2" : "") + " м";
      return {
        total,
        details: "Кухня · " + kitchenLayouts[k.layout] + " · " + lengthText + " · " + k.modules.length + " мод. · " + material.name + " · столешница: " + kitchenCounters[k.counter].name.toLowerCase() + " · " + hardware.handles[state.hardware.handles].name,
        caption: "Кухня · " + kitchenLayouts[k.layout].toLowerCase() + " планировка · фасады из " + material.name + " в оттенке «" + furnitureColor.label + "»"
      };
    }
    function kitchenOp(op) {
      const k = state.kitchen;
      if (op === "add" && k.modules.length < 10) { k.modules.push({ id: k.nextId++, width: 600, type: "base" }); k.selected = k.modules.length - 1; }
      if (op === "dup" && k.modules.length < 10) { k.modules.splice(k.selected + 1, 0, { ...k.modules[k.selected], id: k.nextId++ }); k.selected += 1; }
      if (op === "del" && k.modules.length > 1) { k.modules.splice(k.selected, 1); k.selected = Math.max(0, k.selected - 1); }
      syncKitchenWidth(); render();
    }
    function kitchenSettingsChange(event) {
      const k = state.kitchen, m = k.modules[k.selected]; if (!m) return;
      if (event.target.id === "sectionWidth") m.width = Math.max(300, Math.min(1200, Math.round(Number(event.target.value) / 50) * 50));
      if (event.target.id === "kitchenType") { m.type = kitchenTypes[event.target.value] ? event.target.value : "base"; m.drawers = m.type === "drawers" ? (m.drawers || 3) : m.type === "base" ? Math.min(2, m.drawers || 0) : 0; }
      if (event.target.id === "kitchenDrawers") { const isD = m.type === "drawers"; m.drawers = Math.max(isD ? 1 : 0, Math.min(isD ? 4 : 2, Math.round(Number(event.target.value) || 0))); }
      syncKitchenWidth(); render();
    }
    function renderEditorControls() {
      if (state.product !== "kitchen") { renderWardrobeControls(); return; }
      const k = state.kitchen, m = k.modules[k.selected] || k.modules[0];
      document.getElementById("sectionList").innerHTML = k.modules.map((item, index) => '<button type="button" class="section-tab ' + (index === k.selected ? "active" : "") + '" data-section-index="' + index + '">Модуль ' + (index + 1) + '</button>').join("");
      const dr = Number(m.drawers) || 0, drawersOk = m.type === "base" || m.type === "drawers";
      document.getElementById("sectionSettings").innerHTML = '<label class="editor-field">Ширина, мм<input class="editor-number" id="sectionWidth" type="number" min="300" max="1200" step="50" value="' + m.width + '"></label><label class="editor-field">Тип модуля<select class="editor-select" id="kitchenType">' + Object.entries(kitchenTypes).map(([id, t]) => '<option value="' + id + '"' + (id === m.type ? " selected" : "") + '>' + t.name + '</option>').join("") + '</select></label>' + (drawersOk ? '<label class="editor-field">Ящики<input class="editor-number" id="kitchenDrawers" type="number" min="' + (m.type === "drawers" ? 1 : 0) + '" max="' + (m.type === "drawers" ? 4 : 2) + '" step="1" value="' + (m.type === "drawers" ? (dr || 3) : dr) + '"></label>' : "");
      document.getElementById("kitchenSettings").innerHTML = (k.layout !== "straight" ? '<label class="editor-field">Боковая сторона, мм<input class="editor-number" id="kitchenSide" type="number" min="1200" max="3600" step="100" value="' + k.side + '"></label>' : "") + '<label class="editor-field">Столешница<select class="editor-select" id="kitchenCounter">' + Object.entries(kitchenCounters).map(([id, c]) => '<option value="' + id + '"' + (id === k.counter ? " selected" : "") + '>' + c.name + '</option>').join("") + '</select></label><label class="editor-field">Верхние шкафы<select class="editor-select" id="kitchenUppers"><option value="1"' + (k.uppers ? " selected" : "") + '>Есть</option><option value="0"' + (k.uppers ? "" : " selected") + '>Нет</option></select></label>';
      document.querySelectorAll("[data-layout]").forEach(button => button.classList.toggle("active", button.dataset.layout === k.layout));
      document.querySelectorAll("[data-mode]").forEach(button => button.classList.toggle("active", button.dataset.mode === state.editorMode));
    }
    /* ====== Декоры, положение, двери ====== */
    function shadeHex(hex, k) {
      const n = parseInt(hex.slice(1), 16);
      const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v * k));
      return "#" + c.map(v => v.toString(16).padStart(2, "0")).join("");
    }
    function getShift() { return Number((state.product === "kitchen" ? state.kitchen.shift : state.shift) || 0); }
    function setShift(value) {
      value = Math.max(-1, Math.min(1, value));
      if (state.product === "kitchen") state.kitchen.shift = value; else state.shift = value;
      render();
    }
    let decorBuilt = false;
    function renderDecor(active) {
      const grid = document.getElementById("decorGrid");
      if (!grid || !window.DECORS || !window.BTex) return;
      if (!decorBuilt) {
        grid.innerHTML = '<button type="button" class="decor-swatch is-none" data-decor="none" title="Без текстуры — цвет из палитры" aria-label="Без текстуры, цвет из палитры"></button>' +
          window.DECORS.map(d => '<button type="button" class="decor-swatch" data-decor="' + d.id + '" title="' + d.name + ' · ' + d.code + '" aria-label="' + d.name + ', ' + d.code + '" style="background-image:url(' + window.BTex.dataURL(d.kind, 56, d.tint, { seed: 3 }) + ')"></button>').join("");
        decorBuilt = true;
      }
      grid.querySelectorAll("[data-decor]").forEach(button => button.classList.toggle("active", button.dataset.decor === (active ? active.id : "none")));
      document.getElementById("decorNote").textContent = active ? active.name + " · " + active.code + " (Egger). Текстура сгенерирована для примера — в заказе уточним декор по образцам." : "Цвет из палитры ниже. Выберите декор, чтобы увидеть текстуру материала.";
    }
    let swatchesBuilt = false;
    function renderSwatches() {
      /* Кнопки строим один раз, дальше только переключаем active — раньше пересобиралось ~130 кнопок на каждое изменение */
      [["furnitureSwatches", "furnitureColor", "Цвет мебели"], ["wallSwatches", "wallColor", "Цвет стены"], ["floorSwatches", "floorColor", "Цвет пола"]].forEach(([id, key, label]) => {
        const holder = document.getElementById(id);
        if (!swatchesBuilt) holder.innerHTML = unifiedColors.map(color => '<button type="button" class="swatch" data-color="' + color.id + '" style="--swatch:' + color.hex + '" aria-label="' + label + ': ' + color.label + '" title="' + color.label + '"></button>').join("");
        holder.querySelectorAll(".swatch").forEach(button => button.classList.toggle("active", button.dataset.color === state[key]));
      });
      swatchesBuilt = true;
    }
    function render() {
      const isKitchen = state.product === "kitchen";
      const product = catalog[state.product];
      const furnitureColor = unifiedColors.find(c => c.id === state.furnitureColor) || unifiedColors[0];
      const wallColor = unifiedColors.find(c => c.id === state.wallColor) || unifiedColors[0];
      const floorColor = unifiedColors.find(c => c.id === state.floorColor) || unifiedColors[0];
      const material = materials[state.material];
      const decor = state.decor && state.decor !== "none" && window.DECORS ? window.DECORS.find(d => d.id === state.decor) : null;
      const furnitureShown = decor ? { ...furnitureColor, label: decor.name + " " + decor.code, hex: decor.tint, dark: shadeHex(decor.tint, 0.68) } : furnitureColor;
      const { width, height, depth } = state.dimensions;
      const colorMultiplier = 1 + (furnitureColor.extra || 0);
      const sectionFeatures = state.sections.reduce((sum, section) => sum + section.shelves * 450 + (section.drawers || 0) * 2400 + (section.rod ? 1200 : 0) + (section.facade === "glass" ? 4200 : section.facade === "open" ? -900 : 0), 0);
      const hardwarePrice = hardware.handles[state.hardware.handles].price + hardware.hinges[state.hardware.hinges].price;
      const total = Math.max(35000, Math.round((product.rate * (width / 1000) * (height / product.defaultDimensions.height) * (depth / product.defaultDimensions.depth) * material.multiplier * colorMultiplier + sectionFeatures + hardwarePrice) / 100) * 100);

      renderEditorControls();
      Object.entries(dimensionInputs).forEach(([key, input]) => { const lim = dimLimits(key); input.min = lim[0]; input.max = lim[1]; input.value = curDims()[key]; });
      document.querySelectorAll("#dimensionControls label > span").forEach((span, i) => { span.textContent = isKitchen ? ["Длина", "Высота", "Глубина"][i] : ["Ширина", "Высота", "Глубина"][i]; });
      document.getElementById("kitchenLayout").hidden = !isKitchen;
      document.getElementById("editorTitle").textContent = isKitchen ? "Редактор кухни" : "Редактор шкафа";
      document.getElementById("addSection").textContent = isKitchen ? "+ Модуль" : "+ Секция";
      document.getElementById("sectionList").setAttribute("aria-label", isKitchen ? "Модули кухни" : "Секции шкафа");
      document.getElementById("positionGroup").hidden = isKitchen && state.kitchen.layout !== "straight";
      document.getElementById("doorsRow").hidden = isKitchen;
      document.getElementById("shiftRange").value = Math.round(getShift() * 100);
      document.querySelectorAll("[data-doors]").forEach(b => b.classList.toggle("active", (b.dataset.doors === "open") === !!state.doorsOpen));
      renderDecor(decor);
      document.documentElement.style.setProperty("--furniture-color", furnitureShown.hex);
      document.documentElement.style.setProperty("--palette-color", furnitureColor.hex);
      document.documentElement.style.setProperty("--furniture-dark", furnitureShown.dark || "#6b5b4d");
      document.documentElement.style.setProperty("--wall-color", wallColor.hex);
      document.documentElement.style.setProperty("--floor-color", floorColor.hex);
      const lightColors = { warm: "#ffc46b", neutral: "#fff9e8", cool: "#cfe5ff" };
      document.documentElement.style.setProperty("--light-color", lightColors[state.lightType]);
      document.documentElement.style.setProperty("--light-strength", Number(state.lightStrength) / 100);
      document.documentElement.style.setProperty("--light-darkness", ((100 - Number(state.lightStrength)) / 100) * .48);
      roomWall.className = "wall" + (state.wallType === "paint" ? "" : " is-" + state.wallType);
      roomFloor.className = "floor is-" + state.floorType;
      document.querySelector(".scene").className = "scene mode-" + state.editorMode;
      handleSelect.value = state.hardware.handles;
      hingeSelect.value = state.hardware.hinges;
      priceValue.textContent = "от " + rubles(total);
      priceDetails.textContent = product.name + " · " + state.sections.length + " секц. · " + width + " × " + depth + " × " + height + " мм · " + material.name + " · " + hardware.handles[state.hardware.handles].name + " · " + hardware.hinges[state.hardware.hinges].name;
      sceneCaption.textContent = product.name + " из " + material.name + " в оттенке «" + furnitureShown.label + "»";
      if (isKitchen) {
        const info = kitchenInfo(furnitureShown, material);
        priceValue.textContent = "от " + rubles(info.total);
        priceDetails.textContent = info.details;
        sceneCaption.textContent = info.caption;
      }
      document.getElementById("priceDisclaimer").textContent = isKitchen
        ? "Ориентир для кухни без бытовой техники. Точная смета зависит от столешницы, фурнитуры, мойки и техники, доставки и монтажа."
        : "Ориентир для Улан‑Удэ на 2026 год с поправкой +10–15% на декор. Точная смета зависит от фурнитуры, наполнения, доставки и монтажа.";
      document.querySelectorAll(".product-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.product === state.product));
      document.querySelectorAll("[data-wall-type]").forEach(btn => btn.classList.toggle("active", btn.dataset.wallType === state.wallType));
      document.querySelectorAll("[data-floor-type]").forEach(btn => btn.classList.toggle("active", btn.dataset.floorType === state.floorType));
      document.querySelectorAll("[data-light-type]").forEach(btn => btn.classList.toggle("active", btn.dataset.lightType === state.lightType));
      document.getElementById("lightRange").value = state.lightStrength;
      document.getElementById("lightValue").textContent = state.lightStrength + "%";
      document.getElementById("cameraZoomValue").textContent = Math.round(state.camera.zoom * 100) + "%";
      materialSelect.value = state.material;
      renderSwatches();
      localStorage.setItem("buyantuev-editor-v1", JSON.stringify(state));
      window.dispatchEvent(new Event("cabinet:rendered"));
    }
    function resetConfigurator() { const product = state.product; state = { ...defaultState, sections: defaultSections.map(section => ({ ...section })), dimensions: { ...catalog.wardrobe.defaultDimensions }, camera: { ...defaultState.camera }, hardware: { ...defaultState.hardware }, kitchen: freshKitchen(), product, decor: defaultState.decor }; syncKitchenWidth(); render(); }

    materialSelect.addEventListener("change", () => { state.material = materialSelect.value; render(); });
    handleSelect.addEventListener("change", () => { state.hardware.handles = handleSelect.value; render(); });
    hingeSelect.addEventListener("change", () => { state.hardware.hinges = hingeSelect.value; render(); });
    document.getElementById("editorModes").addEventListener("click", (event) => {
      const button = event.target.closest("[data-mode]"); if (!button) return; state.editorMode = button.dataset.mode; if (state.editorMode === "3d") state.camera = { ...defaultState.camera }; render();
    });
    document.getElementById("addSection").addEventListener("click", () => {
      if (state.product === "kitchen") return kitchenOp("add");
      if (state.sections.length >= 8) return;
      state.sections.push({ id: state.nextSectionId++, width: 500, shelves: 2, drawers: 0, facade: "door" });
      state.dimensions.width = Math.max(600, Math.round(state.sections.reduce((sum, section) => sum + section.width, 0) / 50) * 50);
      state.selectedSection = state.sections.length - 1; render();
    });
    document.getElementById("duplicateSection").addEventListener("click", () => {
      if (state.product === "kitchen") return kitchenOp("dup");
      if (state.sections.length >= 8) return;
      const copy = { ...state.sections[state.selectedSection], id: state.nextSectionId++ };
      state.sections.splice(state.selectedSection + 1, 0, copy); state.selectedSection += 1;
      state.dimensions.width = Math.max(600, Math.round(state.sections.reduce((sum, section) => sum + section.width, 0) / 50) * 50); render();
    });
    document.getElementById("removeSection").addEventListener("click", () => {
      if (state.product === "kitchen") return kitchenOp("del");
      if (state.sections.length <= 1) return;
      state.sections.splice(state.selectedSection, 1); state.selectedSection = Math.max(0, state.selectedSection - 1);
      state.dimensions.width = Math.max(600, Math.round(state.sections.reduce((sum, section) => sum + section.width, 0) / 50) * 50); render();
    });
    document.getElementById("sectionList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-section-index]"); if (!button) return; if (state.product === "kitchen") state.kitchen.selected = Number(button.dataset.sectionIndex); else state.selectedSection = Number(button.dataset.sectionIndex); render();
    });
    document.getElementById("sectionSettings").addEventListener("change", (event) => {
      if (state.product === "kitchen") return kitchenSettingsChange(event);
      const section = state.sections[state.selectedSection]; if (!section) return;
      if (event.target.id === "sectionWidth") section.width = Math.max(250, Math.min(2000, Math.round(Number(event.target.value) / 50) * 50));
      if (event.target.id === "sectionShelves") section.shelves = Math.max(0, Math.min(8, Number(event.target.value) || 0));
      if (event.target.id === "sectionDrawers") section.drawers = Math.max(0, Math.min(6, Number(event.target.value) || 0));
      if (event.target.id === "sectionRod") section.rod = event.target.value === "1";
      if (event.target.id === "sectionFacade") section.facade = event.target.value;
      state.dimensions.width = Math.max(600, Math.round(state.sections.reduce((sum, item) => sum + item.width, 0) / 50) * 50); render();
    });
    function setDimension(key, value) {
      const limits = dimLimits(key), dims = curDims();
      dims[key] = Math.max(limits[0], Math.min(limits[1], Math.round(Number(value) / 50) * 50));
      if (key === "width" && state.product === "kitchen") {
        const k = state.kitchen, total = k.modules.reduce((sum, m) => sum + m.width, 0), ratio = dims.width / total;
        k.modules.forEach(m => { m.width = Math.max(300, Math.min(1200, Math.round(m.width * ratio / 50) * 50)); });
        syncKitchenWidth();
      } else if (key === "width" && state.sections.length) {
        const currentTotal = state.sections.reduce((sum, section) => sum + section.width, 0);
        const ratio = state.dimensions.width / currentTotal;
        state.sections.forEach(section => { section.width = Math.max(250, Math.round(section.width * ratio / 50) * 50); });
      }
      render();
    }
    document.getElementById("dimensionControls").addEventListener("click", (event) => {
      const button = event.target.closest("[data-dim]"); if (!button) return;
      setDimension(button.dataset.dim, curDims()[button.dataset.dim] + Number(button.dataset.step));
    });
    Object.entries(dimensionInputs).forEach(([key, input]) => {
      input.addEventListener("change", () => setDimension(key, input.value));
      input.addEventListener("wheel", (event) => { if (document.activeElement !== input) return; event.preventDefault(); setDimension(key, curDims()[key] + (event.deltaY < 0 ? 50 : -50)); }, { passive: false });
    });
    document.getElementById("furnitureSwatches").addEventListener("click", (event) => {
      const button = event.target.closest("[data-color]"); if (!button) return; state.furnitureColor = button.dataset.color; state.decor = "none"; render();
    });
    document.getElementById("wallSwatches").addEventListener("click", (event) => {
      const button = event.target.closest("[data-color]"); if (!button) return; state.wallColor = button.dataset.color; render();
    });
    document.getElementById("wallTypes").addEventListener("click", (event) => {
      const button = event.target.closest("[data-wall-type]"); if (!button) return; state.wallType = button.dataset.wallType; render();
    });
    document.getElementById("floorTypes").addEventListener("click", (event) => {
      const button = event.target.closest("[data-floor-type]"); if (!button) return; state.floorType = button.dataset.floorType; render();
    });
    document.getElementById("floorSwatches").addEventListener("click", (event) => {
      const button = event.target.closest("[data-color]"); if (!button) return; state.floorColor = button.dataset.color; render();
    });
    document.getElementById("lightRange").addEventListener("input", (event) => { state.lightStrength = Number(event.target.value); render(); });
    document.getElementById("lightTypes").addEventListener("click", (event) => {
      const button = event.target.closest("[data-light-type]"); if (!button) return; state.lightType = button.dataset.lightType; render();
    });
    document.getElementById("resetButton").addEventListener("click", resetConfigurator);
    document.querySelectorAll("[data-open-product]").forEach(link => link.addEventListener("click", (event) => {
      const id = link.dataset.openProduct; if (!catalog[id]) return;
      event.preventDefault(); state.product = id; state.camera = { ...defaultState.camera }; render();
      document.getElementById("configurator").scrollIntoView({ behavior: "smooth" });
    }));
    document.getElementById("decorGrid").addEventListener("click", (event) => {
      const button = event.target.closest("[data-decor]"); if (!button) return;
      state.decor = button.dataset.decor; render();
    });
    document.getElementById("shiftLeft").addEventListener("click", () => setShift(getShift() - 0.34));
    document.getElementById("shiftRight").addEventListener("click", () => setShift(getShift() + 0.34));
    document.getElementById("shiftCenter").addEventListener("click", () => setShift(0));
    document.getElementById("shiftRange").addEventListener("input", (event) => setShift(Number(event.target.value) / 100));
    document.querySelectorAll("[data-doors]").forEach(button => button.addEventListener("click", () => { state.doorsOpen = button.dataset.doors === "open"; render(); }));
    document.getElementById("productTabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-product]"); if (!button || !catalog[button.dataset.product] || button.dataset.product === state.product) return;
      state.product = button.dataset.product; state.camera = { ...defaultState.camera }; render();
    });
    document.getElementById("kitchenLayoutChips").addEventListener("click", (event) => {
      const button = event.target.closest("[data-layout]"); if (!button) return;
      const k = state.kitchen; k.layout = button.dataset.layout;
      while (k.layout === "u" && k.modules.reduce((sum, m) => sum + m.width, 0) < 2400 && k.modules.length < 10) k.modules.push({ id: k.nextId++, width: 600, type: "base" });
      syncKitchenWidth(); render();
    });
    document.getElementById("kitchenSettings").addEventListener("change", (event) => {
      const k = state.kitchen;
      if (event.target.id === "kitchenSide") k.side = Math.max(1200, Math.min(3600, Math.round(Number(event.target.value) / 100) * 100));
      if (event.target.id === "kitchenCounter") k.counter = kitchenCounters[event.target.value] ? event.target.value : "laminate";
      if (event.target.id === "kitchenUppers") k.uppers = event.target.value === "1";
      render();
    });
    document.querySelectorAll(".faq-item button").forEach(button => button.addEventListener("click", () => {
      const item = button.closest(".faq-item"); const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(faq => { faq.classList.remove("open"); faq.querySelector("button").setAttribute("aria-expanded", "false"); });
      if (!wasOpen) { item.classList.add("open"); button.setAttribute("aria-expanded", "true"); }
    }));
    window.getCabinetState = () => state;
    document.getElementById("currentYear").textContent = new Date().getFullYear();
    render();

  