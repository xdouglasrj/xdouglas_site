import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ============================================================
// GET /api/_debug/dbcheck — diagnóstico temporário, somente leitura.
// Não expõe credenciais nem hash de senha: só host (sem userinfo),
// metadados de schema e, se ?email= for passado, estado não sensível
// da conta (active/blocked/timestamps de reset e login).
// Remover após o diagnóstico.
// ============================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  let host = '(não foi possível ler)'
  try {
    const url = new URL(process.env.DATABASE_URL ?? '')
    host = url.host
  } catch {
    // ignora
  }

  const columns = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY column_name
  `
  const dbInfo = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`
  const userCount = await prisma.user.count()

  const email = request.nextUrl.searchParams.get('email')
  let account: unknown = undefined
  if (email) {
    // $queryRaw em vez de prisma.user.findUnique: resetPasswordUsedAt já existe
    // como coluna no banco mas ainda não foi adicionado ao schema.prisma commitado,
    // então o Prisma Client gerado em produção não reconhece o campo no select tipado.
    const rows = await prisma.$queryRaw<
      Array<{
        username: string | null
        active: boolean
        blocked: boolean
        reset_password_expires_at: Date | null
        reset_password_used_at: Date | null
        last_login_at: Date | null
        created_at: Date
        updated_at: Date
      }>
    >`
      SELECT username, active, blocked, reset_password_expires_at, reset_password_used_at, last_login_at, created_at, updated_at
      FROM users WHERE email = ${email.trim().toLowerCase()}
    `
    account = rows[0] ?? { found: false }
  }

  return NextResponse.json({
    host,
    database: dbInfo[0]?.db,
    userColumns: columns.map((c) => c.column_name),
    hasArtisticName: columns.some((c) => c.column_name === 'artistic_name'),
    userCount,
    account,
  })
}
