/**
 * Interações gerais: menu, navegação ativa, FAQ, modais, contatos e utilidades.
 */
(function () {
  "use strict";

  var CONFIG = window.SITE_CONFIG || {};
  var contato = CONFIG.contato || {};

  /* ---------------- Utilidades compartilhadas ---------------- */
  var UI = (window.UI = {});

  UI.whatsappUrl = function (mensagem) {
    var base = "https://wa.me/" + (contato.whatsapp || "");
    return mensagem ? base + "?text=" + encodeURIComponent(mensagem) : base;
  };

  var toastEl = document.querySelector("[data-toast]");
  var toastTimer;
  UI.toast = function (texto) {
    if (!toastEl) return;
    toastEl.querySelector("[data-toast-text]").textContent = texto;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 3800);
  };

  /* ---------------- Links de WhatsApp e telefone ---------------- */
  document.querySelectorAll("[data-whatsapp]").forEach(function (link) {
    link.href = UI.whatsappUrl(link.getAttribute("data-whatsapp") || "");
  });
  document.querySelectorAll("[data-phone]").forEach(function (link) {
    if (contato.telefone) link.href = "tel:" + contato.telefone;
  });
  document.querySelectorAll("[data-phone-label]").forEach(function (el) {
    if (contato.telefoneExibicao) el.textContent = contato.telefoneExibicao;
  });

  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------- Foto com fallback ---------------- */
  document.querySelectorAll(".js-photo").forEach(function (img) {
    function fallback() {
      var box = document.createElement("div");
      box.className = "img-fallback";
      box.setAttribute("role", "img");
      box.setAttribute("aria-label", img.alt);
      box.innerHTML = '<span class="icon" aria-hidden="true">person</span><span class="t-label-md">Dr. Alexandre Constantino</span>';
      img.replaceWith(box);
    }
    if (img.complete && img.naturalWidth === 0) fallback();
    else img.addEventListener("error", fallback, { once: true });
  });

  /* ---------------- Cabeçalho: transparente sobre o hero, sólido ao rolar ---------------- */
  var header = document.querySelector(".site-header");
  function atualizarCabecalho() {
    header.classList.toggle("is-solid", window.scrollY > 24);
  }
  window.addEventListener("scroll", atualizarCabecalho, { passive: true });
  atualizarCabecalho();

  /* ---------------- Menu móvel ---------------- */
  var toggle = document.querySelector(".menu-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  function setMenu(aberto) {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", String(aberto));
    toggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    toggle.querySelector(".icon").textContent = aberto ? "close" : "menu";
    mobileNav.hidden = !aberto;
    header.classList.toggle("is-open", aberto);
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a, button")) setMenu(false);
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ---------------- Navegação ativa (scroll spy) ---------------- */
  var navLinks = document.querySelectorAll("[data-nav]");
  var secoes = ["inicio", "especialidades", "sobre-o-medico", "consultorios", "duvidas"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function marcarAtivo(id) {
    navLinks.forEach(function (link) {
      var ativo = link.getAttribute("data-nav") === id;
      link.classList.toggle("is-active", ativo);
      if (ativo) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function atualizarAtivo() {
    var linha = window.scrollY + window.innerHeight * 0.35;
    var atual = secoes[0] && secoes[0].id;
    secoes.forEach(function (sec) {
      if (sec.offsetTop <= linha) atual = sec.id;
    });
    // No fim da página, a última seção fica ativa
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      atual = secoes[secoes.length - 1].id;
    }
    marcarAtivo(atual);
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { atualizarAtivo(); ticking = false; });
  }, { passive: true });
  atualizarAtivo();

  /* ---------------- FAQ (acordeão) ---------------- */
  var faqButtons = document.querySelectorAll(".faq-item__toggle");
  function setFaq(btn, aberto) {
    btn.setAttribute("aria-expanded", String(aberto));
    var painel = document.getElementById(btn.getAttribute("aria-controls"));
    if (painel) painel.classList.toggle("is-open", aberto);
  }
  faqButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var aberto = btn.getAttribute("aria-expanded") === "true";
      faqButtons.forEach(function (outro) { if (outro !== btn) setFaq(outro, false); });
      setFaq(btn, !aberto);
    });
  });

  /* ---------------- Modais acessíveis ---------------- */
  var FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var pilha = [];

  function visiveis(modal) {
    return Array.prototype.filter.call(modal.querySelectorAll(FOCAVEIS), function (el) {
      return el.offsetParent !== null;
    });
  }

  UI.openModal = function (id, origem) {
    var modal = document.getElementById(id);
    if (!modal || !modal.hidden) return;
    modal.hidden = false;
    pilha.push({ modal: modal, origem: origem || document.activeElement });
    document.body.classList.add("is-locked");
    setMenu(false);
    var alvo = modal.querySelector("input, select, textarea") || visiveis(modal)[0];
    // Em telas de toque, focar o primeiro botão evita abrir o teclado automaticamente
    if (window.matchMedia("(pointer: coarse)").matches) alvo = modal.querySelector(".modal__close");
    if (alvo) setTimeout(function () { alvo.focus(); }, 30);
    modal.dispatchEvent(new CustomEvent("modal:open"));
  };

  UI.closeModal = function () {
    var topo = pilha.pop();
    if (!topo) return;
    topo.modal.hidden = true;
    if (!pilha.length) document.body.classList.remove("is-locked");
    if (topo.origem && typeof topo.origem.focus === "function") topo.origem.focus();
  };

  document.addEventListener("click", function (e) {
    var abrir = e.target.closest("[data-open-modal]");
    if (abrir) {
      e.preventDefault();
      UI.openModal(abrir.getAttribute("data-open-modal"), abrir);
      return;
    }
    if (e.target.closest("[data-close-modal]")) UI.closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (!pilha.length) {
      if (e.key === "Escape" && toggle && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false); toggle.focus();
      }
      return;
    }
    var modal = pilha[pilha.length - 1].modal;
    if (e.key === "Escape") { e.preventDefault(); UI.closeModal(); return; }
    if (e.key === "Tab") {
      var itens = visiveis(modal);
      if (!itens.length) return;
      var primeiro = itens[0], ultimo = itens[itens.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  });

  // Links diretos como site.com/#privacidade abrem o modal correspondente
  var hashModal = { "#termos": "modal-termos", "#privacidade": "modal-privacidade", "#agendar": "modal-agendamento" };
  if (hashModal[location.hash]) UI.openModal(hashModal[location.hash]);
})();
