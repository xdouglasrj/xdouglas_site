# Tarefa: adaptar a cópia do site Cheirinho Bom para rodar sob um subcaminho

Você trabalha SOMENTE dentro da pasta atual (uma cópia descartável do frontend React/CRA/CRACO do site Cheirinho Bom, já com `node_modules` instalado e um commit Git de base). Não toque em nada fora dela. Não faça commit.

## Objetivo

O site será publicado como arquivos estáticos dentro de outro site:

- A PÁGINA abre no endereço `/cheirinho-bom` (página única, sem React Router).
- Os ARQUIVOS (JS, CSS, fotos) ficam servidos em `/cheirinho-bom-static/...`.

O build será gerado assim (rode exatamente isto para validar):

```
PUBLIC_URL=/cheirinho-bom-static CI=false npx craco build
```

Com isso o CRA já prefixa os bundles JS/CSS e `%PUBLIC_URL%` no `public/index.html`, e expõe `process.env.PUBLIC_URL` no código.

## O que mudar (somente adaptação técnica — nada visual, nada de conteúdo)

1. **Fotos em `public/fotos`**: toda string no código com caminho absoluto `/fotos/...` passa a usar o prefixo `process.env.PUBLIC_URL`. Casos conhecidos (confira com busca, pode haver mais):
   - `src/components/ProductCard.jsx`: `` `/fotos/${product.photo}` ``
   - `src/components/ImageModal.jsx`: `` `/fotos/${product.photo}` ``
   - `src/components/Hero.jsx`: `"/fotos/logo.jpg"`
   - `src/components/Footer.jsx`: `"/fotos/logo2.jpg"`
   Forma: `` `${process.env.PUBLIC_URL}/fotos/${product.photo}` ``. Não mude nome de arquivo nenhum.
2. **`public/index.html`**: trocar `href="/fotos/logo2.jpg"` e `href="/fotos/logo.jpg"` por `href="%PUBLIC_URL%/fotos/logo2.jpg"` e `href="%PUBLIC_URL%/fotos/logo.jpg"`. Adicionar `<meta name="robots" content="noindex, nofollow" />` no `<head>` (é uma prévia).
3. **Telemetria da Emergent/PostHog**: em `public/index.html`, remover o `<script src="https://assets.emergent.sh/scripts/emergent-main.js">` e o bloco `<script>` inteiro que inicializa o PostHog (`posthog.init("phc_...", { api_host: "https://ap.emergent.sh", ... })`). Não remover o script de `DataCloneError` nem as fontes do Google.

## Proibido

- Mudar texto, produto, preço, foto, cor, fonte, layout, animação, carrinho, montagem do pedido, número/mensagem do WhatsApp, Instagram ou qualquer comportamento além do listado.
- Renomear, mover ou apagar arquivos de `public/`.
- Mexer em `craco.config.js`, `package.json`, `tailwind.config.js`, `plugins/`.
- Deixar comentários com o seu raciocínio no código.
- Reformatar arquivos: mude só as linhas necessárias.

## Pronto quando (rode e cole a saída no relatório)

1. `PUBLIC_URL=/cheirinho-bom-static CI=false npx craco build` termina com `Compiled successfully` (ou só warnings que já existiam).
2. `grep -rn "emergent.sh\|phc_\|posthog" build/` não encontra nada.
3. `grep -rnoE ".{0,25}/fotos/" build/static/js build/index.html` mostra todo `/fotos/` precedido por `/cheirinho-bom-static` (ou pela variável que o contém).
4. `git diff --stat` lista só arquivos de `src/` e `public/index.html`.

No relatório: lista de arquivos alterados e o que mudou em cada um, e a saída real dos três comandos.
