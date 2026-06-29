import { NextRequest, NextResponse } from 'next/server'
import { publishDueScheduledTracks } from '@/lib/tracks/scheduling'

// ============================================================
// /api/cron/publish-scheduled
//
// Chamado 1x/dia pelo Vercel Cron (plano Hobby só permite essa
// frequência). É só uma garantia — a publicação em si já acontece de
// forma "oportunista" a cada carregamento das páginas de maior
// tráfego (ver chamadas a publishDueScheduledTracks() em
// app/api/musicas/route.ts, admin/musicas, minhas-musicas, upload).
// Protegido por Authorization: Bearer <CRON_SECRET>.
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[PublishScheduled] CRON_SECRET não definido')
    return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const count = await publishDueScheduledTracks()
    console.log(`[PublishScheduled] ${count} música(s) publicada(s) automaticamente`)
    return NextResponse.json({ published: count })
  } catch (err) {
    console.error('[PublishScheduled] Erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Vercel Cron usa GET por padrão
export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request)
}
