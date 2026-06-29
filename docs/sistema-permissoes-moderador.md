# Sistema de moderadores com permissões — o que falta implementar

> Status: planejamento. Hoje existe só uma página de **teste visual**
> (`/admin/configuracoes/permissoes`) — os checkboxes não salvam nada e não
> existe papel de moderador no sistema. Este documento lista tudo que precisa
> ser construído para a função ficar real, para quando for disponibilizada a
> alguns usuários.

## 1. O que já existe hoje

- **Catálogo de permissões** (provisório, validado visualmente): `app/(admin)/admin/configuracoes/permissoes/permission-groups.ts`. 15 permissões em 5 grupos — Conteúdo musical, Comunidade, Usuários, Suporte, Administração (este último marcado como trancado/exclusivo do ADMIN).
- **Página de preview**: `app/(admin)/admin/configuracoes/permissoes/page.tsx` + `permissions-preview-panel.tsx` + `permission-checkbox.tsx`. Busca usuário por username/nome artístico/email e mostra a grade de checkboxes. Estado só em memória do navegador (`useState`), sem chamada de API.
- **Enum `Role`** (`prisma/schema.prisma`): `GUEST | MEMBER | ARTIST | ARTIST_SUPPORTER | ADMIN`. Não tem `MODERATOR`.
- **Gate do painel admin**: `app/(admin)/layout.tsx:23` — `if (payload.role !== 'ADMIN') redirect('/?login=1')`. Hoje é tudo ou nada: só `ADMIN` entra em qualquer rota `/admin/*`.
- **Gate das APIs admin**: `lib/auth/guard.ts` — `withRole(role, handler)` compara por **hierarquia ordinal** (`['GUEST','MEMBER','ARTIST','ARTIST_SUPPORTER','ADMIN']`, índice maior ou igual ao exigido). 15 rotas em `app/api/admin/**` hoje usam `withRole('ADMIN', ...)` diretamente (lista completa na seção 4.4).
- **Middleware** (`middleware.ts`): só verifica se o JWT é válido para qualquer rota `/admin` ou `/api/admin` — **não checa role**. Ou seja, hoje um usuário comum autenticado já passa pelo middleware e é bloqueado mais adiante (no layout e em cada API route). Isso é importante: o middleware não precisa mudar, a lógica de permissão fica nas camadas de baixo.

## 2. Decisão de modelagem de dados

Duas opções para guardar quais permissões um moderador tem:

| Opção | Vantagem | Desvantagem |
|---|---|---|
| **A — coluna array no `User`** (`permissions String[]`, Postgres array nativo do Prisma) | Simples, sem tabela nova, sem join, leitura é 1 campo já carregado com o usuário | Não tem histórico de quem concedeu o quê e quando (resolvido com audit log, ver §4.6) |
| **B — tabela `UserPermission` separada** (`userId`, `permissionId`, `grantedBy`, `grantedAt`) | Histórico nativo, mais fácil de auditar/expirar permissão individual | Mais uma tabela, mais um join em toda checagem de permissão |

**Recomendação:** opção A (coluna array) — o catálogo é pequeno (~15 itens), não vai virar relacional, e o "quem concedeu/quando" já é coberto pelo `AuditLog` que existe. Só migrar para B se um dia for preciso permissão com expiração ou herdada de "cargos" customizados.

### Mudança no `prisma/schema.prisma`

```prisma
enum Role {
  GUEST
  MEMBER
  ARTIST
  ARTIST_SUPPORTER
  MODERATOR   // novo
  ADMIN
}

model User {
  // ...
  permissions String[] @default([]) @map("permissions")
}
```

- `permissions` só tem sentido quando `role == MODERATOR` (ADMIN já tem tudo implicitamente, os demais roles não usam o campo).
- Os valores salvos são os `id` do catálogo (`musicas.moderar`, `denuncias.gerenciar` etc.) — manter `permission-groups.ts` como fonte única da verdade dos ids válidos, tanto no front quanto numa validação de backend (rejeitar id que não existe no catálogo ao salvar).

## 3. Catálogo de permissões — congelar antes de implementar

Antes de criar a migration, fechar esta lista com o que for decidido nas conversas anteriores (grupo "Administração" já definido como trancado/só-ADMIN):

| Grupo | Permissão | id |
|---|---|---|
| Conteúdo musical | Aprovar / remover músicas | `musicas.moderar` |
| Conteúdo musical | Editar metadados de músicas | `musicas.editar` |
| Comunidade | Gerenciar denúncias | `denuncias.gerenciar` |
| Comunidade | Moderar fórum (apagar/trancar) | `forum.moderar` |
| Comunidade | Moderar feed (posts e comentários) | `feed.moderar` |
| Comunidade | Fixar/destacar publicações | `comunidade.fixar` |
| Usuários | Visualizar usuários | `usuarios.visualizar` |
| Usuários | Bloquear / desbloquear usuários | `usuarios.bloquear` |
| Usuários | Editar perfil de usuários | `usuarios.editar` |
| Usuários | Gerenciar convites | `convites.gerenciar` |
| Suporte | Responder tickets de suporte | `suporte.responder` |
| Suporte | Marcar ticket como resolvido | `suporte.resolver` |
| ~~Administração~~ (trancado, só ADMIN) | Acessar configurações do site | `config.acessar` |
| ~~Administração~~ (trancado, só ADMIN) | Gerenciar permissões de moderadores | `permissoes.gerenciar` |
| ~~Administração~~ (trancado, só ADMIN) | Enviar vinheta/aviso geral | `vinheta.enviar` |

Pendente decidir: falta permissão de **analytics/dashboard** (ver estatísticas sem poder editar nada)? Vale a pena adicionar `dashboard.visualizar` se algum moderador só vai acompanhar números.

## 4. O que precisa ser construído

### 4.1 Migration

- Adicionar `MODERATOR` ao enum `Role` e a coluna `permissions String[]` no `User`.
- `npx prisma migrate dev --name add_moderator_role_and_permissions` localmente, depois `prisma migrate deploy` no pipeline de build (já é o que o `package.json` faz no `build` script).

### 4.2 Lib de autorização por permissão

Criar `lib/auth/permissions.ts`:

- `hasPermission(user: { role: string; permissions: string[] }, permissionId: PermissionId): boolean` — `ADMIN` sempre `true`; `MODERATOR` checa se `permissionId` está em `permissions`; outros roles sempre `false`.
- `requirePermission(permissionId)` — variante de `withRole` em `lib/auth/guard.ts`, mas carregando `permissions` do usuário no banco (o JWT não deveria carregar a lista de permissões para não precisar reemitir token a cada mudança — buscar do banco a cada request, é um único campo indexado por PK).
- Importar o catálogo de `permission-groups.ts` para validar ids (mover esse arquivo de dentro da página para `lib/permissions/catalog.ts`, já que vai ser usado por backend e frontend).

### 4.3 Gate da página `/admin` (layout)

Em `app/(admin)/layout.tsx:23`, trocar o bloqueio binário por:

- Permitir `payload.role === 'ADMIN' || payload.role === 'MODERATOR'`.
- Se `MODERATOR`, buscar as permissões do usuário (precisa de uma query ao banco aqui, hoje o layout só decodifica o JWT) e bloquear quem é `MODERATOR` mas ficou sem nenhuma permissão atribuída (conta criada mas ainda não configurada).

### 4.4 Gate de cada API admin

As 15 rotas que hoje usam `withRole('ADMIN', ...)` precisam mapear para a permissão correspondente (ou continuar exclusivas do ADMIN, se for algo do grupo "Administração"):

| Rota | Permissão sugerida |
|---|---|
| `app/api/admin/musicas/route.ts`, `[id]/route.ts` | `musicas.moderar` / `musicas.editar` |
| `app/api/admin/reports/route.ts`, `[id]/route.ts` | `denuncias.gerenciar` |
| `app/api/admin/support/route.ts`, `[id]/route.ts` | `suporte.responder` / `suporte.resolver` |
| `app/api/admin/usuarios/[id]/mapping/route.ts`, `[id]/plan/route.ts` | `usuarios.editar` |
| `app/api/admin/cadastros/[id]/route.ts`, `app/api/admin/waitlist/[id]/route.ts` | `usuarios.bloquear` ou `convites.gerenciar` (conferir o que cada rota faz exatamente) |
| `app/api/admin/settings/*` (auto-accept, content-expiration, upload-limits, vinheta) | `config.acessar` — fica **só ADMIN** (grupo trancado) |
| `app/api/admin/seed-fictional-content/route.ts` | só ADMIN (ferramenta de dev) |

Trocar `withRole('ADMIN', handler)` por algo como `withPermission('musicas.moderar', handler)` nessas rotas, mantendo `withRole('ADMIN', ...)` só nas que forem exclusivas.

### 4.5 Sidebar dinâmica

`components/admin/admin-sidebar.tsx` hoje mostra os mesmos itens (`NAV_ITEMS`, `PEOPLE_ITEMS`) para qualquer um que entra. Precisa:

- Receber o `role` e as `permissions` do usuário logado (vir do layout, que já decodifica o token).
- Filtrar cada item por uma permissão mínima associada (ex: item "Denúncias" só aparece se `hasPermission(user, 'denuncias.gerenciar')`).
- O item "Configurações" (`/admin/configuracoes`) só aparece para `ADMIN` (grupo trancado).

### 4.6 Tornar a página de permissões real (hoje é só preview)

Em `app/(admin)/admin/configuracoes/permissoes/`:

- `page.tsx`: ao buscar o usuário, carregar também as `permissions` atuais dele (hoje a query nem seleciona esse campo) e passar como valor inicial dos checkboxes (hoje sempre começa tudo desmarcado).
- `permissions-preview-panel.tsx`: adicionar um botão "Salvar" por usuário, chamando uma nova rota `PATCH /api/admin/usuarios/[id]/permissions` com a lista de ids marcados.
- Nova rota `app/api/admin/usuarios/[id]/permissions/route.ts`: só `ADMIN` pode chamar (é o próprio item trancado `permissoes.gerenciar`); valida que todo id enviado existe no catálogo; se a lista não for vazia e o usuário ainda for `MEMBER`/outro role, promove para `MODERATOR` automaticamente; se a lista ficar vazia, pode rebaixar de volta.
- Registrar a mudança em `AuditLog` (ver §4.7).

### 4.7 Auditoria

`enum AuditAction` (`prisma/schema.prisma`) não tem uma entrada para isso ainda. Adicionar algo como `PERMISSIONS_UPDATE` e gravar um `AuditLog` toda vez que um ADMIN alterar as permissões de um moderador — quem alterou, para quem, lista antes/depois (campo `metadata` se existir, ou serializar como string).

### 4.8 Onde o moderador vai ver o painel (resposta à pergunta original)

Depois de tudo isso implementado: o moderador faz login normal (mesmo modal de login de sempre), e como `payload.role === 'MODERATOR'` passa pelo gate do `app/(admin)/layout.tsx` — cai exatamente nas mesmas URLs `/admin/...` que o ADMIN usa hoje. A diferença é que a sidebar (§4.5) só mostra os itens liberados pelas permissões dele, e cada API por trás dessas páginas também valida a permissão antes de deixar agir (§4.4) — então mesmo que ele tente acessar uma URL admin diretamente, sem a permissão a API nega.

Não existe (e não precisa existir) um painel separado para moderador — é o mesmo `/admin`, só que com menos coisas visíveis e menos ações permitidas.

## 5. Ordem sugerida de implementação

1. Fechar a lista de permissões (§3) e decidir se falta algo de analytics/dashboard.
2. Migration do banco (§4.1).
3. `lib/auth/permissions.ts` + mover catálogo para `lib/permissions/catalog.ts` (§4.2).
4. Gate do layout admin (§4.3).
5. Tornar a página de permissões real, com botão Salvar (§4.6) + auditoria (§4.7) — assim já dá pra promover o primeiro moderador de teste.
6. Sidebar dinâmica (§4.5).
7. Trocar `withRole('ADMIN', ...)` pelas permissões granulares nas 15 rotas (§4.4) — pode ser feito rota por rota, sem pressa, já que até aqui nenhum moderador real existe ainda.

## 6. Riscos / pontos de atenção

- **Não reemitir o JWT com a lista de permissões dentro** — permissão pode mudar a qualquer momento; se ficar no token, um moderador rebaixado continuaria com acesso até o token expirar. Sempre conferir permissão lendo do banco na request (custo de uma query extra, aceitável no volume atual).
- **Grupo "Administração" nunca deve aparecer marcável** mesmo depois de implementado de verdade — reforçar essa regra tanto no front (já feito, `locked: true`) quanto no backend (rota de salvar permissões deve rejeitar esses 3 ids mesmo que alguém forje a requisição).
- **Promoção/rebaixamento de role automático** (§4.6) é uma conveniência, mas pode confundir — alternativa é o ADMIN escolher manualmente o role `MODERATOR` antes de atribuir permissões, em vez de ser automático. Decidir qual fluxo é mais natural quando for implementar.
