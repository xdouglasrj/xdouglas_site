import { NextRequest, NextResponse } from 'next/server'
import { getTrackTracklist } from '@/lib/tracks/tracklist-writer'

// ============================================================
// GET /api/social/tracks/[id]/tracklist (V3 Plano 10)
// Público (carve-out no middleware) — a barra do player global usa para
// mostrar "♪ música atual" enquanto o set toca, para qualquer visitante.
// Só retorna texto público (posição, tempo, título) — nada sensível.
// ============================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const items = await getTrackTracklist(id)
  return NextResponse.json({ items })
}
