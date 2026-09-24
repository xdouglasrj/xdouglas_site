# Tarefa: registrar as prévias Aura Leblon e Cheirinho Bom no xDouglas (Next.js)

Você trabalha SOMENTE dentro da pasta atual (um worktree Git do site xDouglas, Next.js + TypeScript). Altere SOMENTE estes dois arquivos: `next.config.ts` e `app/data/development.ts`. Nenhum outro arquivo. Não faça commit. Não rode `npm install`.

## Contexto

Duas landing pages já foram geradas como build estático e serão copiadas para `public/aura-leblon-static/` e `public/cheirinho-bom-static/` (cada uma com `index.html` e `static/`). O xDouglas já faz o mesmo com Ian Raposo: veja em `next.config.ts` os `rewrites()` com `{ source: '/ian-raposo', destination: '/ian-raposo-static/index.html' }`.

## O que mudar

1. `next.config.ts`, dentro do array retornado por `async rewrites()`, depois das linhas do Ian Raposo, acrescentar exatamente:

```ts
      { source: '/aura-leblon', destination: '/aura-leblon-static/index.html' },
      { source: '/aura-leblon/cardapio', destination: '/aura-leblon-static/index.html' },
      { source: '/aura-leblon/menu', destination: '/aura-leblon-static/index.html' },
      { source: '/cheirinho-bom', destination: '/cheirinho-bom-static/index.html' },
```

Mesma indentação e estilo (aspas simples, vírgula no fim) das linhas do Ian Raposo. Não mexer em headers, redirects, images ou qualquer outra parte.

2. `app/data/development.ts`, no array `developmentItems`, depois do item `ian-raposo` (que continua idêntico e em primeiro), acrescentar dois itens no mesmo formato:

```ts
  {
    slug: 'aura-leblon',
    name: 'Aura Leblon',
    category: 'Restaurante',
    description: 'Gastronomia contemporânea e comida nutritiva no Leblon',
    image: '/portfolio/aura-leblon.png',
    href: '/aura-leblon',
  },
  {
    slug: 'cheirinho-bom',
    name: 'Cheirinho Bom',
    category: 'Doces e confeitaria',
    description: 'Doces, sobremesas e pedidos pelo WhatsApp',
    image: '/portfolio/cheirinho-bom.png',
    href: '/cheirinho-bom',
  },
```

Textos exatamente como acima (com acentos, UTF-8 sem BOM). Não usar `external`. Não alterar o tipo `DevelopmentItem`. Não tocar em `app/data/portfolio.ts` (projetos concluídos).

## Proibido

- Qualquer arquivo além dos dois citados.
- Reformatar o resto dos arquivos.
- Comentários com raciocínio.

## Pronto quando

`git diff --stat` mostra só `next.config.ts` e `app/data/development.ts`, com as linhas acima acrescentadas e nada removido.
