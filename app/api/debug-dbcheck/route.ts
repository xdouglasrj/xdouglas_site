import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ============================================================
// GET /api/_debug/dbcheck — diagnóstico temporário, somente leitura.
// Não expõe credenciais: só host (sem userinfo) e metadados de schema.
// Remover após o diagnóstico.
// ============================================================

export async function GET(): Promise<NextResponse> {
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

  return NextResponse.json({
    host,
    database: dbInfo[0]?.db,
    userColumns: columns.map((c) => c.column_name),
    hasArtisticName: columns.some((c) => c.column_name === 'artistic_name'),
    userCount,
  })
}
