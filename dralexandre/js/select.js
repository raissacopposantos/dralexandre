/* Menu de seleção personalizado: mantém o <select> nativo (validação/valores) e desenha uma lista própria */
(function () {
  document.querySelectorAll(".select-wrap").forEach(function (wrap) {
    var select = wrap.querySelector("select");
    if (!select) return;
    wrap.classList.add("cselect");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cselect__trigger";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    var labelId = select.id && document.querySelector('label[for="' + select.id + '"]');
    if (labelId) { labelId.id = labelId.id || select.id + "-label"; btn.setAttribute("aria-labelledby", labelId.id + " " + select.id + "-btn"); }
    btn.id = select.id + "-btn";

    var list = document.createElement("ul");
    list.className = "cselect__list";
    list.setAttribute("role", "listbox");
    list.tabIndex = -1;

    var opts = Array.prototype.filter.call(select.options, function (o) { return o.value !== ""; });
    opts.forEach(function (o, i) {
      var li = document.createElement("li");
      li.className = "cselect__option";
      li.setAttribute("role", "option");
      li.dataset.value = o.value;
      li.style.setProperty("--i", i);
      li.innerHTML = '<span></span><span class="icon icon--18" aria-hidden="true">check</span>';
      li.firstChild.textContent = o.textContent;
      li.addEventListener("click", function () { choose(o.value); close(true); });
      list.appendChild(li);
    });

    select.classList.add("cselect__native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    wrap.insertBefore(btn, select);
    wrap.appendChild(list);

    var items = list.children;
    var active = -1;

    function render() {
      var sel = select.options[select.selectedIndex];
      var empty = !select.value;
      btn.textContent = empty ? (select.options[0] ? select.options[0].textContent : "Selecione") : sel.textContent;
      btn.classList.toggle("is-placeholder", empty);
      Array.prototype.forEach.call(items, function (li) {
        li.setAttribute("aria-selected", String(li.dataset.value === select.value));
      });
    }
    function choose(v) {
      select.value = v;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      select.dispatchEvent(new Event("input", { bubbles: true }));
      render();
      wrap.classList.remove("just-picked"); void wrap.offsetWidth; wrap.classList.add("just-picked");
    }
    function setActive(i) {
      if (active > -1 && items[active]) items[active].classList.remove("is-active");
      active = (i + items.length) % items.length;
      items[active].classList.add("is-active");
      items[active].scrollIntoView({ block: "nearest" });
    }
    function open() {
      document.querySelectorAll(".cselect.is-open").forEach(function (w) { if (w !== wrap) w.__close(); });
      wrap.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      var cur = opts.findIndex(function (o) { return o.value === select.value; });
      setActive(cur > -1 ? cur : 0);
    }
    function close(focus) {
      wrap.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      if (focus) btn.focus();
    }
    wrap.__close = function () { close(false); };

    btn.addEventListener("click", function () { wrap.classList.contains("is-open") ? close(false) : open(); });
    btn.addEventListener("keydown", function (e) {
      var isOpen = wrap.classList.contains("is-open");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) return open();
        setActive(active + (e.key === "ArrowDown" ? 1 : -1));
      } else if ((e.key === "Enter" || e.key === " ") && isOpen) {
        e.preventDefault(); choose(items[active].dataset.value); close(true);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault(); e.stopPropagation(); close(true);
      } else if (e.key === "Tab") close(false);
    });
    document.addEventListener("click", function (e) { if (!wrap.contains(e.target)) close(false); });

    select.addEventListener("change", render);
    if (select.form) select.form.addEventListener("reset", function () { setTimeout(render, 0); });
    render();
  });
})();
