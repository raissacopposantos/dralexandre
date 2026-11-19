/**
 * Configuração central do site.
 * Altere aqui os contatos e a chave do Google Maps; nenhum outro arquivo precisa mudar.
 */
window.SITE_CONFIG = {
  contato: {
    // Números que vieram no protótipo do Stitch. Confirme com o consultório antes de publicar.
    whatsapp: "5527999990000",        // formato internacional, só dígitos
    telefone: "+552732350000",        // usado no link tel:
    telefoneExibicao: "(27) 3235 0000"
  },

  mapa: {
    /**
     * Chave da Google Maps Platform (Maps JavaScript API).
     * Deixe vazia para usar OpenStreetMap + Leaflet durante o desenvolvimento.
     * A chave também pode ser passada pela URL para testes: index.html?gmapsKey=SUA_CHAVE
     */
    googleMapsApiKey: "",

    // Opcional: Map ID criado no Google Cloud (habilita marcadores avançados e estilos na nuvem)
    googleMapId: "",

    // Tempo máximo de espera pela API do Google antes de cair no Leaflet (ms)
    timeoutMs: 10000,

    local: {
      nome: "Centro Médico Jardins",
      endereco: "R. Carlos Eduardo Monteiro de Lemos, 262, Sala 206",
      bairroCidade: "Jardim da Penha, Vitória ES",
      cep: "29060-120",
      // Coordenadas aproximadas da rua (CEP 29060-120). Ajuste com o ponto exato do edifício se necessário.
      lat: -20.2890727,
      lng: -40.2924674
    },
    zoom: 16
  }
};
