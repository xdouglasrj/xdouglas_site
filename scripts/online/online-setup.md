# Setup online — GitHub + Vercel + Resend

Scripts para publicar o xDouglas online usando o terminal da sua máquina (que tem internet de saída). O sandbox do Codex aqui não tem, então tudo é operado por você.

## Pré-requisitos

- PowerShell 5.1 ou PowerShell 7 (`pwsh`)
- Git instalado e no PATH (`git --version`)
- Conta GitHub com permissão de escrita no repo `xdouglasrj/xdouglas_site`
- Conta Vercel (https://vercel.com) com **token Full Account** (criar em https://vercel.com/account/tokens)
- Conta Resend (https://resend.com) com domínio **verificado** e **API key full access**

## Ordem de execução

1. **GitHub** — autentica via navegador, commita o que tiver pendente e faz push da branch `main` para o remoto.
2. **Vercel** — cria o projeto `xdouglas`, sobe as 18 variáveis de ambiente, linka o repo GitHub para auto-deploy em `main`, dispara o primeiro deploy.
3. **Resend** — verifica domínio, valida a chave e sobe `RESEND_API_KEY` + `EMAIL_FROM` na Vercel (precisa de `VERCEL_TOKEN` no ambiente).

```powershell
# 1) GitHub
powershell -ExecutionPolicy Bypass -File scripts\online\setup-github.ps1

# 2) Vercel (vai pedir o token Full Account)
powershell -ExecutionPolicy Bypass -File scripts\online\setup-vercel.ps1

# 3) Resend (vai pedir RESEND_API_KEY e EMAIL_FROM)
$env:VERCEL_TOKEN = "<seu token Full Account>"
powershell -ExecutionPolicy Bypass -File scripts\online\setup-resend.ps1
```

## O que cada script faz

### `setup-github.ps1`

- Verifica se `gh` está instalado; se não estiver, tenta `winget install --id GitHub.cli -e`, depois MSI do GitHub como fallback.
- Roda `gh auth login --web` (device flow). Abre o navegador, mostra um código do tipo `XXXX-XXXX`, você cola em `github.com/login/device` e autoriza.
- Converte o remote para HTTPS (para usar o credential helper do `gh`) e faz `git add -A`, `git commit` (se houver mudanças) e `git push -u origin main`.
- Sem PAT, sem tokens circulando. Idempotente — se já estiver autenticado, pula o device flow.

### `setup-vercel.ps1`

- Pede o token da Vercel uma vez (prompt seguro, não grava em disco).
- Lê `.env.local` (fallback para `.env.example`) e sobe 18 variáveis:
  - **Plain**: `DATABASE_URL`, `DIRECT_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME_PUBLIC`, `R2_BUCKET_NAME_PRIVATE`, `R2_PUBLIC_HOSTNAME`, `R2_PUBLIC_URL`, `IP_API_URL`, `NEXT_PUBLIC_APP_URL`, `EMAIL_FROM`, `NODE_ENV`
  - **Sensitive**: `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `ANALYTICS_ENCRYPTION_KEY`, `RESEND_API_KEY`, `CRON_SECRET`
- Aplica em **production + preview + development** (idempotente — se já existe, considera atualizado).
- **Bloqueia** se `DATABASE_URL` ou `DIRECT_URL` ainda apontarem para `localhost`. Sem banco gerenciado o deploy morre.
- Detecta team da Vercel; pergunta se quer usar pessoal ou team.
- Cria o projeto `xdouglas` se não existir, já linkado a `xdouglasrj/xdouglas_site` com auto-deploy em `main`.
- Dispara o primeiro deploy via API e imprime a URL (`https://xdouglas.vercel.app`).

### `setup-resend.ps1`

- Pede `RESEND_API_KEY` no prompt seguro.
- Lista os domínios da conta e mostra o status (verified / pending).
- Pede o `EMAIL_FROM` desejado. Se o domínio não estiver verificado, **avisa mas continua** (a chave já sobe para a Vercel; o envio real só funciona depois de verificar o domínio).
- Se `VERCEL_TOKEN` estiver no ambiente, sobe `RESEND_API_KEY` e `EMAIL_FROM` na Vercel via API.
- Se não estiver, imprime os comandos `vercel env add` para você rodar manualmente.

## Variáveis de ambiente necessárias

As mesmas que estão no `.env.example`. O script le do `.env.local` se existir. **Confira antes de rodar** — especialmente:

- `DATABASE_URL` / `DIRECT_URL` — apontar para Postgres gerenciado (Supabase / Neon / Railway). Em produção, `DIRECT_URL` deve ser a URL **não-pooled** (sem `pgbouncer` no meio) para as migrations.
- `JWT_SECRET` / `REFRESH_TOKEN_SECRET` — gere com `openssl rand -hex 32`.
- `ANALYTICS_ENCRYPTION_KEY` — idem.
- `R2_*` — credenciais do Cloudflare R2, dois buckets: `xdouglas-media` (público — capas/avatars/suporte) e `xdouglas-audio-private` (privado — áudio/vinheta, só via URL assinada). Sem isso o upload e o stream quebram.
- `EMAIL_FROM` — remetente em um domínio **verificado** no Resend.

## Pós-deploy

- Acesse `https://xdouglas.vercel.app` (ou o domínio customizado).
- Faça login admin: `admin@xdouglas.com` / `xdouglas_admin_2024!`. **Troque a senha em produção**.
- Rode `npm run db:migrate:prod` em algum lugar (Vercel não roda migrations automaticamente). Sugestão: usar o Supabase SQL editor ou um job único no GitHub Actions.
- Se algo quebrar, logs ficam em https://vercel.com/dashboard → xdouglas → Logs.

## Limpeza / rollback

- **Apagar projeto Vercel**: `vercel rm xdouglas --yes` ou no painel.
- **Remover envs**: `vercel env rm <KEY> production` (repetir para preview/development).
- **Reverter último deploy**: no painel da Vercel → Deployments → Promote to Production uma versão anterior.
- **Desautorizar gh**: `gh auth logout`.
