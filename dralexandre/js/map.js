/**
 * Mapa interativo do consultório.
 *
 * 1. Com chave configurada (js/config.js ou ?gmapsKey=), carrega a Google Maps JavaScript API.
 * 2. Sem chave, ou se o Google falhar (chave inválida, rede, tempo esgotado), usa Leaflet + OpenStreetMap.
 * 3. Se nenhum provedor carregar, mostra uma mensagem de erro com o endereço e link de rota.
 *
 * O mapa só é inicializado quando a seção entra na tela, para não pesar o carregamento inicial.
 */
(function () {
  "use strict";

  var CFG = (window.SITE_CONFIG && window.SITE_CONFIG.mapa) || {};
  var LOCAL = CFG.local;
  var canvas = document.getElementById("map-canvas");
  if (!canvas || !LOCAL) return;

  var statusEl = document.querySelector("[data-map-status]");
  var providerEl = document.querySelector("[data-map-provider]");
  var hintEl = document.querySelector("[data-map-hint]");
  var recenterBtn = document.querySelector("[data-map-recenter]");
  var directionsLink = document.querySelector("[data-map-directions]");

  var enderecoCompleto = LOCAL.endereco + ", " + LOCAL.bairroCidade + ", " + LOCAL.cep;
  var LEAFLET_JS = "vendor/leaflet/leaflet.js";
  var LEAFLET_CSS = "vendor/leaflet/leaflet.css";

  var recentrar = function () {};

  // Rota no Google Maps (abre em nova aba; o mapa da página continua funcionando)
  directionsLink.href = "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent(LOCAL.nome + ", " + enderecoCompleto);

  recenterBtn.addEventListener("click", function () {
    recentrar();
    canvas.closest(".map").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  /* ---------------- Estados visuais ---------------- */
  function status(texto, icone, erro) {
    statusEl.hidden = false;
    statusEl.classList.toggle("map__status--error", !!erro);
    statusEl.innerHTML =
      '<span class="icon icon--32" aria-hidden="true">' + icone + "</span>" +
      '<span class="t-label-md">' + texto + "</span>";
  }
  function pronto(provedor) {
    statusEl.hidden = true;
    providerEl.textContent = provedor;
    providerEl.hidden = false;
    canvas.closest(".map").setAttribute("data-provider", provedor);
  }
  function falhaTotal(motivo) {
    console.error("[mapa]", motivo);
    status("Não foi possível carregar o mapa agora.", "wrong_location", true);
    statusEl.insertAdjacentHTML("beforeend",
      '<span class="t-body-sm">' + LOCAL.nome + "<br>" + enderecoCompleto + "</span>" +
      '<a class="btn btn--pill btn--sm btn--primary t-label-md" target="_blank" rel="noopener" href="' +
      directionsLink.href + '">Abrir rota no Google Maps</a>');
  }

  // Aviso "Ctrl + rolagem" quando o usuário rola sobre o mapa sem Ctrl (Leaflet)
  var hintTimer;
  function mostrarDica(texto) {
    hintEl.textContent = texto;
    hintEl.classList.add("is-visible");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hintEl.classList.remove("is-visible"); }, 1400);
  }

  /* ---------------- Carregadores ---------------- */
  function carregarScript(src, timeout) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      var timer = setTimeout(function () { reject(new Error("Tempo esgotado ao carregar " + src)); }, timeout || 15000);
      s.src = src; s.async = true;
      s.onload = function () { clearTimeout(timer); resolve(); };
      s.onerror = function () { clearTimeout(timer); reject(new Error("Falha de rede ao carregar " + src)); };
      document.head.appendChild(s);
    });
  }
  function carregarCss(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href;
    document.head.appendChild(l);
  }

  /* ---------------- Google Maps ---------------- */
  var ESTILO_GOOGLE = [
    { elementType: "geometry", stylers: [{ color: "#f4f1ea" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#546569" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#fcf9f2" }] },
    { featureType: "poi", elementType: "labels.icon", stylers: [{ saturation: -60 }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d8e2dc" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e2dfd8" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#b7dcdd" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] }
  ];

  function iniciarGoogle(chave) {
    return new Promise(function (resolve, reject) {
      var concluido = false;
      function falhar(msg) { if (!concluido) { concluido = true; reject(new Error(msg)); } }

      // Chamado pela API quando a chave é inválida, sem faturamento ou com restrição de domínio
      window.gm_authFailure = function () {
        falhar("Google Maps recusou a chave (gm_authFailure). Verifique a chave, o faturamento e as restrições de domínio.");
      };

      window.__initGoogleMap = function () {
        if (concluido) return;
        try {
          var g = window.google.maps;
          var centro = { lat: LOCAL.lat, lng: LOCAL.lng };
          var opcoes = {
            center: centro,
            zoom: CFG.zoom || 16,
            gestureHandling: "cooperative",
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            clickableIcons: false
          };
          if (CFG.googleMapId) opcoes.mapId = CFG.googleMapId; else opcoes.styles = ESTILO_GOOGLE;

          var mapa = new g.Map(canvas, opcoes);
          var marcador = new g.Marker({
            position: centro,
            map: mapa,
            title: LOCAL.nome,
            icon: {
              path: "M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z",
              fillColor: "#164e50", fillOpacity: 1,
              strokeColor: "#ffffff", strokeWeight: 2.5,
              scale: 1.25, anchor: new g.Point(12, 36)
            }
          });
          var info = new g.InfoWindow({ content: popupHtml() });
          marcador.addListener("click", function () { info.open({ anchor: marcador, map: mapa }); });

          recentrar = function () { mapa.panTo(centro); mapa.setZoom(CFG.zoom || 16); info.open({ anchor: marcador, map: mapa }); };

          // Em falha de autenticação o Google injeta um aviso; aguardamos o primeiro "idle" para confirmar
          g.event.addListenerOnce(mapa, "idle", function () {
            if (concluido) return;
            concluido = true;
            resolve();
          });
        } catch (err) {
          falhar(err.message);
        }
      };

      var url = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(chave) +
        "&callback=__initGoogleMap&loading=async&language=pt-BR&region=BR&v=weekly";
      carregarScript(url, CFG.timeoutMs).catch(function (e) { falhar(e.message); });
      setTimeout(function () { falhar("Tempo esgotado aguardando o Google Maps."); }, (CFG.timeoutMs || 10000) + 2000);
    });
  }

  /* ---------------- Leaflet + OpenStreetMap ---------------- */
  function iniciarLeaflet() {
    carregarCss(LEAFLET_CSS);
    var carregamento = window.L ? Promise.resolve() : carregarScript(LEAFLET_JS, 15000);
    return carregamento.then(function () {
      return new Promise(function (resolve, reject) {
        var L = window.L;
        canvas.innerHTML = "";
        var centro = [LOCAL.lat, LOCAL.lng];
        var mapa = L.map(canvas, {
          center: centro,
          zoom: CFG.zoom || 16,
          scrollWheelZoom: false, // evita que a rolagem da página "prenda" no mapa
          zoomControl: true
        });

        // Política do OSM: domínio único (sem a/b/c) e cabeçalho Referer obrigatório
        var camada = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          referrerPolicy: "strict-origin-when-cross-origin",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }).addTo(mapa);

        var icone = L.divIcon({
          className: "",
          html: '<div class="pin"><div class="pin__body"><span class="icon">medical_services</span></div></div>',
          iconSize: [44, 44],
          iconAnchor: [18, 44],
          popupAnchor: [0, -42]
        });
        var marcador = L.marker(centro, { icon: icone, title: LOCAL.nome, keyboard: true, alt: LOCAL.nome })
          .addTo(mapa)
          .bindPopup(popupHtml());

        recentrar = function () { mapa.flyTo(centro, CFG.zoom || 16, { duration: 0.6 }); marcador.openPopup(); };

        // Ctrl/⌘ + rolagem dá zoom; rolagem simples mostra a dica e rola a página
        canvas.addEventListener("wheel", function (e) {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            mapa.setZoom(mapa.getZoom() + (e.deltaY < 0 ? 1 : -1));
          } else {
            mostrarDica(/Mac/i.test(navigator.platform) ? "Use ⌘ + rolagem para aproximar o mapa" : "Use Ctrl + rolagem para aproximar o mapa");
          }
        }, { passive: false });

        // Mantém o mapa correto quando o contêiner muda de tamanho (responsividade)
        if ("ResizeObserver" in window) new ResizeObserver(function () { mapa.invalidateSize(); }).observe(canvas);

        var erros = 0, carregou = false;
        camada.on("tileload", function () {
          if (!carregou) { carregou = true; resolve(); }
        });
        camada.on("tileerror", function () {
          erros++;
          if (!carregou && erros >= 6) reject(new Error("Os blocos do OpenStreetMap não carregaram (sem conexão?)."));
        });
        setTimeout(function () { if (!carregou) reject(new Error("Tempo esgotado carregando o OpenStreetMap.")); }, 15000);
      });
    });
  }

  function popupHtml() {
    return '<div class="map-popup"><strong>' + LOCAL.nome + "</strong><span>" +
      LOCAL.endereco + "<br>" + LOCAL.bairroCidade + "</span></div>";
  }

  /* ---------------- Orquestração ---------------- */
  function chaveGoogle() {
    var daUrl = new URLSearchParams(location.search).get("gmapsKey");
    return (daUrl || CFG.googleMapsApiKey || "").trim();
  }

  function iniciar() {
    var chave = chaveGoogle();

    // Aberto com dois cliques (file://) o navegador não envia Referer e o OpenStreetMap bloqueia (403)
    if (location.protocol === "file:" && !chave) {
      falhaTotal("Página aberta como arquivo local. Rode um servidor local para o mapa funcionar.");
      statusEl.querySelector(".t-label-md").textContent = "Abra o site por um servidor local (veja o README) para exibir o mapa.";
      return;
    }
    status("Carregando mapa…", "map");

    var tentativa = chave
      ? iniciarGoogle(chave).then(function () { pronto("Google Maps"); })
          .catch(function (err) {
            console.warn("[mapa] Google Maps indisponível, usando OpenStreetMap.", err.message);
            canvas.innerHTML = "";
            return iniciarLeaflet().then(function () {
              pronto("OpenStreetMap");
              window.UI && UI.toast("Google Maps indisponível. Exibindo OpenStreetMap.");
            });
          })
      : iniciarLeaflet().then(function () {
          console.info("[mapa] Sem chave do Google Maps configurada. Exibindo OpenStreetMap + Leaflet.");
          pronto("OpenStreetMap");
        });

    tentativa.catch(function (err) { falhaTotal(err.message); });
  }

  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entradas) {
      if (entradas.some(function (e) { return e.isIntersecting; })) { obs.disconnect(); iniciar(); }
    }, { rootMargin: "400px 0px" });
    obs.observe(canvas);
  } else {
    iniciar();
  }
})();
