# Aprendizado do xDouglas

## Prévias estáticas de landing pages (CRA) em subcaminho

- **O que aconteceu:** o build do Cheirinho Bom saiu com os arquivos apontando para `/Git/cheirinho-bom-static/...`.
  **Por que enganou:** o Git Bash converte `PUBLIC_URL=/algo` em caminho do Windows (`C:/Program Files/Git/algo`) sem avisar, e o build termina com `Compiled successfully`.
  **Próxima vez:** gerar sempre com `MSYS_NO_PATHCONV=1 GENERATE_SOURCEMAP=false PUBLIC_URL=/<slug>-static CI=false npx craco build` e procurar `/Git/` no `build/index.html`.

- **O que aconteceu:** os quatro vídeos do Aura sumiram do commit e a página abriu com vídeo 404.
  **Por que enganou:** o `.gitignore` ignora `*.mp4` na raiz; o `git add -A` pulou os arquivos sem erro, e a remoção do worktree levou as únicas cópias.
  **Próxima vez:** depois de copiar um build para `public/`, comparar `find <pasta> -type f | wc -l` com `git ls-files <pasta> | wc -l`; mídia nova precisa de exceção explícita no `.gitignore`.

- **O que aconteceu:** `tsc` e `next build` falharam com erros em arquivos que não são do produto.
  **Por que enganou:** o `tsconfig.json` incluía `**/*.tsx`, então worktrees antigos dentro de `_descartavel/` entravam na checagem.
  **Próxima vez:** `_descartavel` fica no `exclude` do `tsconfig.json`.

- **Limitação conhecida:** localmente, `next build` para em `/api/generos` e `/musica` devolve 500 porque a senha do banco no `.env` local não vale. Não é causado pelas prévias; `/musica` se confere no domínio público.
