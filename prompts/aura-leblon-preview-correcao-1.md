# Continuação: terminar a adaptação do Aura Leblon ao subcaminho

Você trabalha SOMENTE dentro da pasta atual. Não faça commit. A tarefa completa está descrita abaixo (texto original) e metade dela JÁ FOI FEITA — não desfaça nem refaça o que já está no `git diff`. Falta exatamente isto:

1. `src/components/DayNight.jsx` linhas ~88 e ~95: `src="/brand/venue-night-terrace.webp"` e `src="/brand/venue-party-night.webp"` viram `` src={`${process.env.PUBLIC_URL}/brand/venue-night-terrace.webp`} `` (idem o outro).
2. `src/components/Hero.jsx` linhas ~43 e ~155: `src="/brand/venue-day-party.webp"` e `src="/brand/aura-logo.png"` — mesmo prefixo.
3. `src/components/Manifesto.jsx` linhas ~46-47: `src="/media/reel-cafe.mp4"` e `poster="/media/poster-cafe.jpg"` — mesmo prefixo.
4. `src/pages/MenuPage.jsx` linhas ~126-127: `src="/media/reel-menu.mp4"` e `poster="/media/poster-menu.jpg"` — mesmo prefixo.
5. `src/lib/scroll.js`: em `goToSection`, trocar `if (window.location.pathname !== "/") {` por uma checagem que considere home tanto `/aura-leblon` quanto `/aura-leblon/` (ex.: `const home = ["/aura-leblon", "/aura-leblon/"];` e `if (!home.includes(window.location.pathname)) {`). O resto da função igual.
6. `src/lib/analytics.js`: remover a linha/bloco `try { window.posthog?.capture(event, { ...meta }); } catch (e) {}` e, no início de `trackCta`, retornar sem fazer nada se `process.env.REACT_APP_BACKEND_URL` não estiver definido (`if (!process.env.REACT_APP_BACKEND_URL) return;`). Nada mais muda.
7. Conferir `src/components/Nav.jsx`: os dois `href={`/#${id}`}` devem estar como `` href={`/aura-leblon#${id}`} ``.

Mude só essas linhas, mantendo a indentação original das linhas vizinhas. Sem comentários.

## Pronto quando

Rode (no Git Bash é obrigatório o `MSYS_NO_PATHCONV=1`, senão o caminho é corrompido):

```
MSYS_NO_PATHCONV=1 GENERATE_SOURCEMAP=false PUBLIC_URL=/aura-leblon-static CI=false npx craco build
grep -rnE "[\"'\`](/brand|/media|/menu/|/cardapio-aura)" src
grep -rn "emergent.sh\|phc_\|posthog" build/
```

O build termina com `Compiled successfully`; os dois `grep` não encontram nada. Cole as saídas no relatório.
