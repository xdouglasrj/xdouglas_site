# xDouglas

Plataforma musical privada para produtores, DJs e artistas.

## Stack

- **Next.js 15** com App Router
- **PostgreSQL 16** via Prisma ORM
- **Cloudflare R2** para áudio e capas
- **jose** para JWT (Edge-safe)
- **Tailwind CSS v4**
- **Recharts** para dashboards

---

## Setup local

### Pré-requisitos

- Node.js 22+
- Docker e Docker Compose
- (Opcional) Conta Cloudflare com R2 ativo

### 1. Clone e instale dependências

```bash
git clone https://github.com/seu-usuario/xdouglas.git
cd xdouglas
npm install
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com seus valores. Para desenvolvimento local, os valores padrão do Docker já funcionam para `DATABASE_URL` e `DIRECT_URL`.

Gere os segredos:

```bash
# JWT_SECRET
openssl rand -hex 32

# REFRESH_TOKEN_SECRET
openssl rand -hex 32

# ANALYTICS_ENCRYPTION_KEY
openssl rand -hex 32
```

### 3. Suba o banco de dados

```bash
docker compose up -d
```

Aguarde o healthcheck passar (5-10 segundos):

```bash
docker compose ps
# Status deve ser "healthy"
```

### 4. Execute as migrations e seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

Login admin: `admin@xdouglas.com` / `xdouglas_admin_2024!`

---

## Comandos úteis

```bash
# Banco
npm run db:migrate      # nova migration
npm run db:generate     # gera client Prisma após mudar schema
npm run db:seed         # popula dados iniciais
npm run db:studio       # abre Prisma Studio (GUI do banco)
npm run db:reset        # reseta o banco (dev only)

# Desenvolvimento
npm run dev             # servidor local com hot reload
npm run build           # build de produção
npm run lint            # ESLint
```

---

## Estrutura

```
app/
├── (public)/           # Páginas sem autenticação
│   ├── page.tsx        # Landing page
│   ├── musicas/        # Catálogo público
│   ├── espera/         # Lista de espera
│   └── privacidade/    # Política de privacidade
├── (admin)/            # Painel administrativo (JWT protegido)
│   └── admin/
│       ├── login/
│       ├── dashboard/
│       └── musicas/
└── api/                # API Routes
    ├── download/       # Gera URL assinada R2 (TTL 15min)
    ├── analytics/      # Coleta de eventos
    ├── admin/          # Endpoints admin
    └── waitlist/       # Lista de espera

lib/
├── analytics/          # Hash IP (LGPD), eventos, geo
├── auth/               # JWT, cookies HTTP-only
├── security/           # Rate limit, detecção de bots
└── storage/            # Interface + providers (R2, local)
```

---

## Decisões de arquitetura

Documentadas no arquivo `xDouglas_Arquitetura_Fase0.docx`.

Principais decisões não alteráveis:

- Downloads via URL assinada R2 — servidor nunca trafega binário
- Analytics em duas camadas: `analytics_raw_events` (com ip_hash, 90 dias) + `analytics_events` (sem IP, permanente)
- IP armazenado apenas como hash SHA-256 com salt rotativo (LGPD)
- JWT validado no Edge sem consulta ao banco (middleware.ts)
- Tokens em banco armazenados como hash SHA-256, nunca o token original

---

## Deploy (Vercel)

1. Importe o repositório na Vercel
2. Configure todas as variáveis do `.env.example` no painel da Vercel
3. Para o banco de produção, use Supabase, Neon ou Railway e configure `DATABASE_URL` e `DIRECT_URL`
4. O deploy é automático a cada push na branch `main`

```bash
# Migration em produção (executar manualmente ou via CI)
npm run db:migrate:prod
```
