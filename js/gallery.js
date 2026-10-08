/* Карусель работ + просмотр крупно. Без внешних библиотек. */
(function () {
  var track = document.getElementById("worksTrack");
  if (!track) return;
  var slides = Array.prototype.slice.call(track.querySelectorAll(".slide"));
  var dotsBox = document.getElementById("worksDots"), count = document.getElementById("worksCount");
  var dots = slides.map(function (_, i) { var d = document.createElement("span"); d.className = "car-dot"; dotsBox.appendChild(d); return d; });
  var current = 0;
  function step() { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth; }
  function setCurrent(i) {
    current = Math.max(0, Math.min(slides.length - 1, i));
    dots.forEach(function (d, k) { d.classList.toggle("on", k === current); });
    count.textContent = (current + 1) + " / " + slides.length;
  }
  function goTo(i) { track.scrollTo({ left: slides[Math.max(0, Math.min(slides.length - 1, i))].offsetLeft - slides[0].offsetLeft, behavior: "smooth" }); }
  var ticking = false;
  track.addEventListener("scroll", function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { setCurrent(Math.round(track.scrollLeft / step())); ticking = false; });
  }, { passive: true });
  document.getElementById("worksPrev").addEventListener("click", function () { goTo(current - 1); });
  document.getElementById("worksNext").addEventListener("click", function () { goTo(current + 1); });
  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); }
  });
  /* перетаскивание мышью на компьютере */
  var down = null, moved = false;
  track.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = { x: e.clientX, left: track.scrollLeft }; moved = false; track.classList.add("grab"); });
  window.addEventListener("pointermove", function (e) { if (!down) return; var dx = e.clientX - down.x; if (Math.abs(dx) > 5) moved = true; track.scrollLeft = down.left - dx; });
  window.addEventListener("pointerup", function () { if (!down) return; down = null; track.classList.remove("grab"); goTo(Math.round(track.scrollLeft / step())); });
  setCurrent(0);

  /* просмотр крупно */
  var lb = document.getElementById("lightbox"), img = document.getElementById("lbImg"), cap = document.getElementById("lbCap"), idx = 0;
  function show(i) {
    idx = (i + slides.length) % slides.length;
    var s = slides[idx].querySelector("img");
    img.src = s.currentSrc || s.src; img.alt = s.alt; cap.textContent = slides[idx].querySelector("figcaption").textContent;
  }
  function open(i) { show(i); if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", ""); document.documentElement.style.overflow = "hidden"; }
  function close() { if (typeof lb.close === "function") lb.close(); else lb.removeAttribute("open"); document.documentElement.style.overflow = ""; }
  slides.forEach(function (s, i) { s.addEventListener("click", function () { if (!moved) open(i); }); });
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
