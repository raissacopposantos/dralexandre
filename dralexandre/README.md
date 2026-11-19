# Dr. Alexandre Constantino | Landing page

Site em HTML, CSS e JavaScript puro, construído a partir do protótipo exportado do Google Stitch (`code.html`, `DESIGN.md` e `screen.png`).

## Estrutura

```
site/
├── index.html              Página única com todas as seções do protótipo + modais
├── css/
│   ├── tokens.css          Cores, fontes, raios, sombras e espaçamentos do DESIGN.md
│   ├── base.css            Reset, escala tipográfica, layout e utilidades
│   ├── components.css      Botões, chips, cards, cabeçalho, FAQ, formulário, modal, mapa, toast
│   └── sections.css        Estilos de cada seção (hero, especialidades, sobre, locais, CTA, rodapé)
├── js/
│   ├── config.js           Contatos, chave do Google Maps e coordenadas do consultório
│   ├── ui.js               Menu móvel, navegação ativa, FAQ, modais, links de contato
│   ├── form.js             Formulário de agendamento (máscara, validação, envio demonstrativo)
│   └── map.js              Mapa: Google Maps JavaScript API com alternativa Leaflet + OpenStreetMap
├── vendor/leaflet/         Leaflet 1.9.4 (local, sem depender de CDN)
└── assets/img/favicon.svg
```

## Como executar

O site não precisa de build. Por causa do carregamento de scripts e do mapa, abra por um servidor local em vez de clicar duas vezes no arquivo:

```bash
cd site
python3 -m http.server 8080
# ou: npx serve .
```

Depois acesse http://localhost:8080.

## Google Maps

Sem chave configurada, o mapa usa OpenStreetMap com Leaflet e já funciona (zoom, arrastar, marcador, balão, centralizar).

Para usar o Google Maps:

1. No Google Cloud Console, ative a **Maps JavaScript API** e o faturamento do projeto.
2. Crie uma chave e restrinja por **referenciador HTTP** (ex.: `https://seudominio.com.br/*` e `http://localhost:8080/*`).
3. Coloque a chave em `js/config.js`, no campo `mapa.googleMapsApiKey`.
4. Opcional: crie um Map ID e coloque em `mapa.googleMapId`.

Para testar uma chave sem editar arquivos: `http://localhost:8080/?gmapsKey=SUA_CHAVE`.

Se a chave for recusada (`gm_authFailure`), a rede falhar ou o carregamento passar de 10 segundos, o site troca sozinho para o OpenStreetMap e avisa o visitante. Se nenhum mapa carregar, aparece o endereço com um link de rota.

## Dados a confirmar antes de publicar

- WhatsApp `5527999990000` e telefone `(27) 3235 0000` vieram do protótipo e parecem números de exemplo. Altere em `js/config.js`.
- A foto do médico está hospedada no Google (`lh3.googleusercontent.com/aida-public/...`), link temporário do Stitch. Salve a imagem em `assets/img/` e troque o `src` das duas tags `img.js-photo` no `index.html`. Se o link sair do ar, aparece um espaço reservado no lugar.
- As coordenadas do consultório são as da Rua Carlos Eduardo Monteiro de Lemos (CEP 29060-120). Ajuste `lat`/`lng` para o ponto exato do Centro Médico Jardins se quiser.
- Os textos de Termos de Uso e Privacidade são provisórios.

## Formulário

O botão "Agendar Consulta" (cabeçalho, menu móvel e "Marcar Horário" no rodapé) abre o formulário de agendamento. Não existe backend: o envio é simulado, nada é gravado e, ao final, o visitante pode mandar a solicitação já preenchida pelo WhatsApp da recepção. Para ligar a um backend real, substitua o `setTimeout` em `js/form.js` por um `fetch` para a sua API.
