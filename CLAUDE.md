# Convenções do projeto

## Logo fixa no topo (área logada)

O `IconSidebar` (`components/layout/icon-sidebar.tsx`) renderiza a logo xDouglas fixa no topo, tanto no mobile (dentro do header `sticky`, h-14) quanto no desktop (faixa fixa própria, `h-20`, acima do trilho de ícones).

Qualquer página ou layout novo que use `<IconSidebar />` deve dar ao `<main>` (ou wrapper de conteúdo) as classes:

```
md:ml-16 md:pt-20
```

- `md:ml-16` — afasta do trilho de ícones lateral (desktop).
- `md:pt-20` — afasta da faixa fixa da logo (desktop), evitando que o conteúdo fique atrás dela.

No mobile não é necessário `pt`, pois o header com a logo é `sticky` (ocupa espaço no fluxo normal, não overlay).

Não recrie a logo dentro da página — ela já vem do `IconSidebar`.
