/* Карусель работ (бесконечная) + просмотр крупно. Без внешних библиотек.
   Принцип: слайды дублируются слева и справа (3 одинаковых набора). Когда прокрутка
   останавливается в «чужом» наборе, мы незаметно переносим её на тот же слайд в среднем наборе. */
(function () {
  var track = document.getElementById("worksTrack");
  if (!track) return;
  var slides = Array.prototype.slice.call(track.querySelectorAll(".slide"));   /* настоящие слайды */
  var n = slides.length;
  if (!n) return;
  var dotsBox = document.getElementById("worksDots");
  var dots = slides.map(function (_, i) { var d = document.createElement("span"); d.className = "car-dot"; dotsBox.appendChild(d); return d; });

  slides.forEach(function (s, i) { s.dataset.i = i; });
  function clones() {
    return slides.map(function (s) { var c = s.cloneNode(true); c.setAttribute("aria-hidden", "true"); return c; });
  }
  var before = clones(), after = clones();
  before.forEach(function (c) { track.insertBefore(c, slides[0]); });
  after.forEach(function (c) { track.appendChild(c); });
  var all = before.concat(slides, after);                                       /* 3 набора подряд */

  function step() { return all[1].offsetLeft - all[0].offsetLeft; }
  function posOf(k) { return all[k].offsetLeft - all[0].offsetLeft; }
  function index() { return Math.round(track.scrollLeft / step()); }            /* номер в общем списке 0..3n-1 */
  function real(k) { return ((k % n) + n) % n; }

  function mark() {
    var r = real(index());
    dots.forEach(function (d, k) { d.classList.toggle("on", k === r); });
  }
  function jump(k) { track.scrollTo({ left: posOf(k), behavior: "instant" }); }
  function goTo(k) { track.scrollTo({ left: posOf(Math.max(0, Math.min(all.length - 1, k))), behavior: "smooth" }); }

  /* перенос в средний набор, когда пользователь не касается карусели и прокрутка остановилась */
  var touching = false, dragging = false, idle = null;
  function normalize() {
    if (touching || dragging) return;
    var k = index();
    if (k < n || k >= 2 * n) jump(real(k) + n);
    mark();
  }
  function scheduleNormalize() { clearTimeout(idle); idle = setTimeout(normalize, 140); }

  var ticking = false;
  track.addEventListener("scroll", function () {
    scheduleNormalize();
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { mark(); ticking = false; });
  }, { passive: true });
  track.addEventListener("touchstart", function () { touching = true; }, { passive: true });
  track.addEventListener("touchend", function () { touching = false; scheduleNormalize(); }, { passive: true });
  track.addEventListener("touchcancel", function () { touching = false; scheduleNormalize(); }, { passive: true });

  document.getElementById("worksPrev").addEventListener("click", function () { goTo(index() - 1); });
  document.getElementById("worksNext").addEventListener("click", function () { goTo(index() + 1); });
  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(index() + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index() - 1); }
  });

  /* перетаскивание мышью на компьютере */
  var down = null, moved = false;
  track.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = { x: e.clientX, left: track.scrollLeft }; dragging = true; moved = false; track.classList.add("grab"); });
  window.addEventListener("pointermove", function (e) { if (!down) return; var dx = e.clientX - down.x; if (Math.abs(dx) > 5) moved = true; track.scrollLeft = down.left - dx; });
  window.addEventListener("pointerup", function () { if (!down) return; down = null; dragging = false; track.classList.remove("grab"); goTo(index()); scheduleNormalize(); });

  /* старт — первый настоящий слайд (начало среднего набора); пересчёт при смене размера окна */
  var lastReal = 0;
  function start() { jump(n); mark(); }
  start();
  window.addEventListener("load", start);
  window.addEventListener("resize", function () { lastReal = real(index()); jump(lastReal + n); mark(); });

  /* просмотр крупно */
  var lb = document.getElementById("lightbox"), img = document.getElementById("lbImg"), cap = document.getElementById("lbCap"), idx = 0;
  function show(i) {
    idx = (i + slides.length) % slides.length;
    var s = slides[idx].querySelector("img");
    img.src = s.currentSrc || s.src; img.alt = s.alt; cap.textContent = slides[idx].querySelector("figcaption").textContent;
  }
  function open(i) { show(i); if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", ""); document.documentElement.style.overflow = "hidden"; }
  function close() { if (typeof lb.close === "function") lb.close(); else lb.removeAttribute("open"); document.documentElement.style.overflow = ""; }
  all.forEach(function (s) { s.addEventListener("click", function () { if (!moved) open(+s.dataset.i); }); });
  document.getElementById("lbClose").addEventListener("click", close);
  document.getElementById("lbPrev").addEventListener("click", function () { show(idx - 1); });
  document.getElementById("lbNext").addEventListener("click", function () { show(idx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  lb.addEventListener("close", function () { document.documentElement.style.overflow = ""; });
  lb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") show(idx + 1); if (e.key === "ArrowLeft") show(idx - 1); });
  var tx = null;
  lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); tx = null; });
})();
