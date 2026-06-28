import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredComments } from '@/lib/social/comments-cleanup'

// ============================================================
// /api/comments-cleanup
//
// Chamado 1x/dia por Vercel Cron. Apaga em definitivo os comentários
// que já passaram do prazo de exibição (getContentExpirationHours).
// Protegido por Authorization: Bearer <CRON_SECRET>.
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[CommentsCleanup] CRON_SECRET não definido')
    return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const result = await cleanupExpiredComments()
    console.log(`[CommentsCleanup] ${result.deleted} comentários expirados removidos em ${result.ranAt}`)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[CommentsCleanup] Erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Vercel Cron usa GET por padrão
export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request)
}
