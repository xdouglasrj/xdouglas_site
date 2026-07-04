import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { TRACK_SELECT, serializeTrack } from './queries'
import type { TrackPublic } from './types'
import { getDurationBucket } from './track-kinds'

// ============================================================
// Busca de faixas com filtros DJ (V3 Plano 5) — texto + gênero,
// mood, tom, faixa de BPM e tag. V3 Plano 16 adiciona tipo
// (kind) e faixa de duração. Todos combináveis entre si.
// ============================================================

export interface TrackSearchFilters {
  q?: string | null
  genre?: string | null
  mood?: string | null
  key?: string | null
  bpmMin?: number | null
  bpmMax?: number | null
  tag?: string | null
  /** V3 Plano 16 — "track" | "set" | "podcast" */
  kind?: string | null
  /** V3 Plano 16 — id de DURATION_BUCKETS (ex.: "ate-15", "90-mais") */
  durationBucket?: string | null
}

const SEARCH_LIMIT = 30

export function hasAnyTrackFilter(f: TrackSearchFilters): boolean {
  return !!(f.q || f.genre || f.mood || f.key || f.bpmMin || f.bpmMax || f.tag || f.kind || f.durationBucket)
}

export async function searchTracks(filters: TrackSearchFilters): Promise<TrackPublic[]> {
  if (!hasAnyTrackFilter(filters)) return []

  const where: Prisma.TrackWhereInput = { published: true }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { artist: { name: { contains: filters.q, mode: 'insensitive' } } },
      { producerName: { contains: filters.q, mode: 'insensitive' } },
    ]
  }
  if (filters.genre) where.genre = filters.genre
  if (filters.mood) where.mood = filters.mood
  if (filters.key) where.key = filters.key
  if (filters.tag) where.tags = { has: filters.tag.toLowerCase() }
  if (filters.kind) where.kind = filters.kind
  if (filters.bpmMin || filters.bpmMax) {
    where.bpm = {
      ...(filters.bpmMin ? { gte: filters.bpmMin } : {}),
      ...(filters.bpmMax ? { lte: filters.bpmMax } : {}),
    }
  }
  if (filters.durationBucket) {
    const bucket = getDurationBucket(filters.durationBucket)
    if (bucket) {
      where.durationSeconds = {
        gte: bucket.minSeconds,
        ...(bucket.maxSeconds !== null ? { lt: bucket.maxSeconds } : {}),
      }
    }
  }

  const raws = await prisma.track.findMany({
    where,
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    take: SEARCH_LIMIT,
    select: TRACK_SELECT,
  })

  return raws.map((raw) => serializeTrack(raw))
}
