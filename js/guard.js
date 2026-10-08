/* Защита: запрет вложения сайта в чужие frame, защита фото от простого копирования, мягкая проверка окружения. */
(function () {
  "use strict";
  try { if (window.top !== window.self) window.top.location = window.self.location; } catch (e) { document.documentElement.style.display = "none"; }
  var shield = function (e) { if (e.target && e.target.closest && e.target.closest("img, .carousel, .lightbox, .hero-card, .product-card .pc-media")) e.preventDefault(); };
  document.addEventListener("contextmenu", shield);
  document.addEventListener("dragstart", shield);
  /* шрифты подгружаем без блокировки отрисовки (inline-обработчики запрещены политикой безопасности) */
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
})();
