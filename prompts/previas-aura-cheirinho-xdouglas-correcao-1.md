# Correção: indentação em app/data/development.ts

Você trabalha SOMENTE dentro da pasta atual. Altere SOMENTE `app/data/development.ts`. Não faça commit.

No array `developmentItems`, as linhas que fecham o item `ian-raposo` e o item `aura-leblon` ficaram como `},` na coluna 0. Elas devem ter dois espaços de indentação, igual ao fechamento do item `cheirinho-bom`: `  },`.

Nada mais muda. Pronto quando `git diff app/data/development.ts` não mostrar nenhuma linha `+},` sem os dois espaços, e todo o resto do conteúdo continuar igual.
