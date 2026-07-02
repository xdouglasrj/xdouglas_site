# Convenções do projeto

## Logo fixa no topo (área logada) + topbar

O `IconSidebar` (`components/layout/icon-sidebar.tsx`) renderiza, para usuário logado: o trilho de ícones lateral (desktop) e, dentro dele, a `Topbar` (`components/layout/topbar.tsx`) — logo + busca centralizada + notificação + avatar, fixa no topo (`h-20`), tanto no mobile (dentro do header `sticky`, h-14) quanto no desktop.

A logo é sempre um link: `/inicio` quando logado, `/` quando deslogado. Isso vale em qualquer header novo — nunca deixe a logo sem `<Link>`.

Para visitante anônimo (sem login) nas páginas públicas de música/gênero/artista, use `PublicHeader` (`components/layout/public-header.tsx`) em vez de `IconSidebar` — não faz sentido mostrar trilho de navegação autenticado (upload, logout etc.) para quem não tem conta. `PublicHeader` reaproveita a `Topbar` com `isLoggedIn={false}` (mostra botão "Entrar" no lugar do avatar/notificação).

Qualquer página ou layout novo que use `<IconSidebar />` deve dar ao `<main>` (ou wrapper de conteúdo) as classes:

```
md:ml-16 md:pt-20
```

- `md:ml-16` — afasta do trilho de ícones lateral (desktop).
- `md:pt-20` — afasta da faixa fixa da topbar (desktop), evitando que o conteúdo fique atrás dela.

Layouts que usam `PublicHeader` (sem trilho) só precisam de `pt-14 md:pt-20` (sem `ml-16`, já que não há trilho lateral).

No mobile não é necessário `pt`, pois o header com a logo é `sticky` (ocupa espaço no fluxo normal, não overlay).

Não recrie a logo dentro da página — ela já vem do `IconSidebar`/`PublicHeader`.
