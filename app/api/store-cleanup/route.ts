import { NextRequest, NextResponse } from 'next/server'
import { runStoreCleanup } from '@/lib/store/cleanup'

// ============================================================
// /api/store-cleanup
//
// Chamado periodicamente por Vercel Cron. Expira compras AWAITING_USE
// vencidas e limpa destaques/fixações que já passaram da validade.
// Protegido por Authorization: Bearer <CRON_SECRET>.
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[StoreCleanup] CRON_SECRET não definido')
    return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const result = await runStoreCleanup()
    console.log('[StoreCleanup]', result)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[StoreCleanup] Erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Vercel Cron usa GET por padrão
export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request)
}
