/* Мобильное меню (бургер) */
(function () {
  var btn = document.getElementById("burger"), menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;
  function set(open) {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    btn.classList.toggle("open", open);
  }
  btn.addEventListener("click", function () { set(menu.hidden); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  document.addEventListener("click", function (e) { if (!menu.hidden && !e.target.closest(".site-header")) set(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 760) set(false); });
})();
