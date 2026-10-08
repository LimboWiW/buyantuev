
    /* ====== Контакты ====== */
    const CONTACTS = {
      phone: "+79243942160",
      telegram: "https://t.me/AldarBuyantuev",
      instagram: "https://www.instagram.com/mebel_buyantuev?stkn=MWR6aDJjdzdsMWsxbg==",
      max: "+79243942160"   // MAX открывается по номеру телефона — по нажатию номер копируется
    };

    (function () {
      const dialog = document.getElementById("contactModal");
      const list = document.getElementById("contactList");
      if (!dialog || !list) return;
      const prettyPhone = p => { const d = p.replace(/\D/g, ""); return d.length === 11 ? "+7 " + d.slice(1, 4) + " " + d.slice(4, 7) + "-" + d.slice(7, 9) + "-" + d.slice(9) : p; };
      const nick = u => "@" + u.replace(/^https?:\/\/[^/]+\//i, "").split(/[?#/]/)[0].replace(/^@/, "");
      const ICONS = {
        phone: '<path d="M6.6 3h3l1.4 4-2 1.3a11 11 0 0 0 5.7 5.7l1.3-2 4 1.4v3A2.6 2.6 0 0 1 17.4 19C9.5 18.5 5.5 14.5 5 6.6A2.6 2.6 0 0 1 6.6 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
        telegram: '<path d="M21 4 3.5 11l5.2 1.9L10 19l3-3.6 4.3 3.2L21 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m8.7 12.9 8-5.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="7" r="1.1" fill="currentColor"/>',
        max: '<path d="M4 12a8 8 0 1 1 3.3 6.5L4 19.5l1.2-3.6A8 8 0 0 1 4 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m8.5 14.5 1.6-5 1.9 3 1.9-3 1.6 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
      };
      const rows = [
        { kind: "phone", label: "Позвонить", shown: prettyPhone(CONTACTS.phone), href: "tel:" + CONTACTS.phone.replace(/[^\d+]/g, "") },
        { kind: "telegram", label: "Telegram", shown: nick(CONTACTS.telegram), href: CONTACTS.telegram },
        { kind: "instagram", label: "Instagram", shown: nick(CONTACTS.instagram), href: CONTACTS.instagram },
        { kind: "max", label: "MAX", shown: prettyPhone(CONTACTS.max), copy: CONTACTS.max }
      ];
      rows.forEach(row => {
        const el = document.createElement(row.copy ? "button" : "a");
        el.className = "cm-row";
        el.dataset.kind = row.kind;
        if (row.copy) el.type = "button";
        else { el.href = row.href; if (row.kind !== "phone") { el.target = "_blank"; el.rel = "noopener noreferrer"; } }
        el.innerHTML = '<span class="cm-ico"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' + ICONS[row.kind] + '</svg></span><span class="cm-text"><span class="cm-label"></span><span class="cm-value"></span></span><span class="cm-arrow" aria-hidden="true">' + (row.copy ? "⧉" : "→") + '</span>';
        el.querySelector(".cm-label").textContent = row.label;
        el.querySelector(".cm-value").textContent = row.shown;
        if (row.copy) el.addEventListener("click", async () => {
          try { await navigator.clipboard.writeText(row.copy); }
          catch (e) { const t = document.createElement("textarea"); t.value = row.copy; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e2) {} t.remove(); }
          el.querySelector(".cm-label").textContent = "MAX · номер скопирован — найдите нас в MAX";
          setTimeout(() => { el.querySelector(".cm-label").textContent = row.label; }, 3500);
        });
        list.appendChild(el);
      });

      let lastFocus = null;
      function openModal(event) {
        if (event) event.preventDefault();
        lastFocus = document.activeElement;
        if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
        document.documentElement.style.overflow = "hidden";
      }
      function closeModal() {
        if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open");
        document.documentElement.style.overflow = "";
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      }
      document.querySelectorAll("[data-contact-open]").forEach(el => el.addEventListener("click", openModal));
      document.getElementById("contactClose").addEventListener("click", closeModal);
      dialog.addEventListener("click", event => { if (event.target === dialog) closeModal(); });
      dialog.addEventListener("cancel", () => { document.documentElement.style.overflow = ""; });
      dialog.addEventListener("close", () => { document.documentElement.style.overflow = ""; });
      list.addEventListener("click", event => { if (event.target.closest("a.cm-row")) setTimeout(closeModal, 150); });
    })();
  