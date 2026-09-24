# Tarefa: adaptar a cópia do site Aura Leblon para rodar sob um subcaminho

Você trabalha SOMENTE dentro da pasta atual (uma cópia descartável do frontend React/CRA/CRACO do site Aura Leblon, já com `node_modules` instalado e um commit Git de base). Não toque em nada fora dela. Não faça commit.

## Objetivo

O site será publicado como arquivos estáticos dentro de outro site:

- As PÁGINAS abrem nos endereços `/aura-leblon`, `/aura-leblon/cardapio` e `/aura-leblon/menu` (este último continua redirecionando para `/aura-leblon/cardapio`, como hoje).
- Os ARQUIVOS (JS, CSS, imagens, vídeos, PDF, favicon) ficam servidos em `/aura-leblon-static/...`.

O build será gerado assim (você deve rodar exatamente isto para validar):

```
PUBLIC_URL=/aura-leblon-static CI=false npx craco build
```

Com isso o CRA já prefixa os bundles JS/CSS e `%PUBLIC_URL%` no `public/index.html`, e expõe `process.env.PUBLIC_URL` no código.

## O que mudar (somente adaptação técnica — nada visual, nada de conteúdo)

1. **Router**: em `src/App.js`, o `<BrowserRouter>` recebe `basename="/aura-leblon"`. As rotas (`/`, `/cardapio`, `/menu`, `*`) continuam iguais.
2. **Arquivos da pasta `public/`**: toda string no código que aponta para um arquivo de `public/` com caminho absoluto deve passar a usar o prefixo `process.env.PUBLIC_URL`. Casos conhecidos (confira com busca, pode haver mais):
   - `"/brand/..."` em `src/components/Nav.jsx`, `Hero.jsx`, `Footer.jsx`, `InstagramBand.jsx`, `Events.jsx`, `DayNight.jsx`, `ElasticGallery.jsx`, `src/App.js`;
   - `"/media/..."` em `src/components/Manifesto.jsx`, `ElasticGallery.jsx`, `src/pages/MenuPage.jsx`;
   - `"/menu/..."` em `src/components/ElasticGallery.jsx` e a constante `const M = "/menu/";` em `src/data/menu.js`;
   - `menuPdfUrl: "/cardapio-aura-leblon.pdf"` em `src/config/site.js`.
   Forma: `` `${process.env.PUBLIC_URL}/brand/aura-logo.png` `` (ou concatenação equivalente). Não mude nome de arquivo nenhum.
3. **`public/index.html`**: trocar `/brand/venue-day-party.webp` (og:image e preload) e `/favicon.svg` por `%PUBLIC_URL%/brand/venue-day-party.webp` e `%PUBLIC_URL%/favicon.svg`. Adicionar `<meta name="robots" content="noindex, nofollow" />` no `<head>` (é uma prévia).
4. **Telemetria da Emergent/PostHog**: em `public/index.html`, remover o `<script src="https://assets.emergent.sh/scripts/emergent-main.js">` e o bloco `<script>` inteiro que inicializa o PostHog (`posthog.init("phc_...", { api_host: "https://ap.emergent.sh", ... })`). Não remover o JSON-LD nem o script de `DataCloneError`, nem as fontes do Google.
5. **Âncoras de seção**: os links `href={`/#${id}`}` em `src/components/Nav.jsx` (2 lugares), `src/components/Footer.jsx` e o `to={... `/#${p.to}`}` em `src/components/ElasticGallery.jsx` devem apontar para dentro da prévia. Para `<a href>` use `` `/aura-leblon#${id}` ``; o `<Link to>` do React Router já recebe o basename, então lá use `` `/#${p.to}` `` sem mudar (confira: `Link` com basename gera `/aura-leblon/#x`). Os `onClick` com `preventDefault` continuam iguais. O `href="/"` do logo em `Nav.jsx` vira `href="/aura-leblon"` (o `navigate("/")` continua igual).
6. **`src/lib/scroll.js`**: `goToSection` compara `window.location.pathname !== "/"`. Com o basename, a home é `/aura-leblon` (ou `/aura-leblon/`). Ajuste a comparação para tratar essas duas formas como home, para não navegar à toa.
7. **`trackCta` sem import**: `src/components/ElasticGallery.jsx` chama `trackCta(...)` sem importar. Adicione `import { trackCta } from "@/lib/analytics";` (o arquivo existe e exporta `trackCta`). Sem isso, clicar nos botões da galeria lança `ReferenceError`.
8. **Beacon sem backend**: `src/lib/analytics.js` monta `BEACON_URL` com `process.env.REACT_APP_BACKEND_URL`, que não existe nesta prévia (o backend não é publicado), gerando requisição para `undefined/api/track`. Faça `trackCta` não enviar o beacon/fetch quando `process.env.REACT_APP_BACKEND_URL` não estiver definido. Remova também a linha `window.posthog?.capture(...)` (o PostHog foi removido). Nada mais muda nesse arquivo.

## Proibido

- Mudar texto, preço, cardápio, imagem, cor, fonte, layout, animação, links externos (WhatsApp, Instagram, iFood, e-mail, Google Maps) ou qualquer comportamento além do listado.
- Renomear, mover ou apagar arquivos de `public/`.
- Mexer em `craco.config.js`, `package.json`, `tailwind.config.js`, `plugins/`.
- Deixar comentários com o seu raciocínio no código.
- Reformatar arquivos: mude só as linhas necessárias.

## Pronto quando (rode e cole a saída no relatório)

1. `PUBLIC_URL=/aura-leblon-static CI=false npx craco build` termina com `Compiled successfully` (ou só warnings que já existiam).
2. `grep -rn "emergent.sh\|phc_\|posthog" build/` não encontra nada.
3. `grep -rnoE "\"/(brand|media|menu)/|/cardapio-aura-leblon.pdf|\"/favicon.svg" build/static/js build/index.html` não encontra caminho SEM o prefixo `/aura-leblon-static` (todo resultado encontrado deve estar precedido por `/aura-leblon-static`).
4. `git diff --stat` lista só arquivos de `src/` e `public/index.html`.

No relatório: lista de arquivos alterados e o que mudou em cada um, e a saída real dos três comandos.
