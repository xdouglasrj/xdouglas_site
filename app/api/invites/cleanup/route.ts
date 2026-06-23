import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredInvites } from '@/lib/invites/cleanup'

// ============================================================
// /api/invites/cleanup
//
// Chamado 1x/dia pelo Vercel Cron. Remove convites aceitos cujo
// cadastro não foi concluído em 7 dias (libera o email).
// Protegido por Authorization: Bearer <CRON_SECRET>.
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[InvitesCleanup] CRON_SECRET não definido')
    return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const result = await cleanupExpiredInvites()
    console.log(`[InvitesCleanup] ${result.deleted} convites expirados removidos em ${result.ranAt}`)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[InvitesCleanup] Erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Vercel Cron usa GET por padrão
export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request)
}
