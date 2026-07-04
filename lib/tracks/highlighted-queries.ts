import { prisma } from '@/lib/prisma'
import { TRACK_SELECT, serializeTrack } from './queries'
import type { TrackPublic } from './types'

// ============================================================
// V3 Plano 13 — leitura das faixas com destaque PAGO ativo, para as
// vitrines (home + página do gênero). "Ativo" = TrackHighlight com
// endsAt > now e sem cancelamento. Expiração é por filtro na query
// (sem cron) — depois de endsAt a faixa some da vitrine sozinha.
//
// Ordenação pedida pelo plano: mais recente primeiro (startsAt desc).
// Uma faixa pode ter tido vários destaques; agrupamos por trackId e
// mantemos o destaque ativo mais recente.
// ============================================================

async function activeHighlightTrackIds(now: Date, genre?: string | null): Promise<string[]> {
  const highlights = await prisma.trackHighlight.findMany({
    where: {
      canceledAt: null,
      endsAt: { gt: now },
      // só faixas publicadas e (quando for a página do gênero) do gênero
      track: { published: true, ...(genre ? { genre } : {}) },
    },
    select: { trackId: true, startsAt: true },
    orderBy: { startsAt: 'desc' },
  })

  // Dedup por trackId preservando a ordem (mais recente primeiro)
  const seen = new Set<string>()
  const ids: string[] = []
  for (const h of highlights) {
    if (seen.has(h.trackId)) continue
    seen.add(h.trackId)
    ids.push(h.trackId)
  }
  return ids
}

/**
 * Faixas com destaque pago ativo, na ordem "mais recente primeiro".
 * @param genre quando informado, restringe às faixas daquele gênero
 * @param limit teto de itens retornados
 */
export async function listHighlightedTracks(limit: number, genre?: string | null): Promise<TrackPublic[]> {
  const now = new Date()
  const orderedIds = await activeHighlightTrackIds(now, genre)
  if (orderedIds.length === 0) return []

  const ids = orderedIds.slice(0, limit)

  const raws = await prisma.track.findMany({
    where: { id: { in: ids }, published: true },
    select: TRACK_SELECT,
  })

  // Reordena conforme a ordem de destaque (findMany não garante ordem do IN)
  const byId = new Map(raws.map((r) => [r.id, r]))
  const tracks: TrackPublic[] = []
  for (const id of ids) {
    const raw = byId.get(id)
    if (raw) tracks.push(serializeTrack(raw))
  }
  return tracks
}
