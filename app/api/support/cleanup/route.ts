import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredSupportVideos } from '@/lib/support/cleanup'

// ============================================================
// /api/support/cleanup
//
// Chamado 1x/dia por Vercel Cron. Apaga do storage os vídeos de
// chamados de suporte com mais de 7 dias (texto e foto não são afetados).
// Protegido por Authorization: Bearer <CRON_SECRET>.
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[SupportCleanup] CRON_SECRET não definido')
    return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const result = await cleanupExpiredSupportVideos()
    console.log(`[SupportCleanup] ${result.deleted} vídeos expirados removidos em ${result.ranAt}`)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[SupportCleanup] Erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Vercel Cron usa GET por padrão
export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request)
}
