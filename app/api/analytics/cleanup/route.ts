import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredRawEvents } from '@/lib/analytics/cleanup'

// ============================================================
// POST /api/analytics/cleanup
//
// Chamado 1x/dia por Vercel Cron ou serviço externo.
// Protegido por Authorization: Bearer <CRON_SECRET>
//
// Configuração no vercel.json:
// {
//   "crons": [{
//     "path": "/api/analytics/cleanup",
//     "schedule": "0 3 * * *"   <- 03h UTC diariamente
//   }]
// }
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Valida segredo do cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[Cleanup] CRON_SECRET não definido')
    return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const result = await cleanupExpiredRawEvents()

    console.log(
      `[Cleanup] ${result.deleted} raw events expirados deletados em ${result.ranAt}`
    )

    return NextResponse.json(result)
  } catch (err) {
    console.error('[Cleanup] Erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET para Vercel Cron (usa GET por padrão)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request)
}
