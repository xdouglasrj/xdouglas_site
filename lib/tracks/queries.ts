import { prisma } from '@/lib/prisma'
import { getContentCutoffDate } from '@/lib/settings/content-expiration'
import type { TrackPublic } from './types'

// ============================================================
// Select seguro — nunca expõe audioKey, coverKey nem IDs internos
// sensíveis. coverUrl é a URL pública CDN, ok expor.
// ============================================================

const TRACK_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  genre: true,
  bpm: true,
  key: true,
  producerName: true,
  coverUrl: true,
  audioFormat: true,
  audioSizeBytes: true,
  downloadCount: true,
  publishedAt: true,
  artist: {
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      photoUrl: true,
    },
  },
} as const

// ── Serialização ─────────────────────────────────────────────

// BigInt não é JSON-serializável nativamente — converte para string
function serializeTrack(raw: {
  id: string
  slug: string
  title: string
  description: string | null
  genre: string | null
  bpm: number | null
  key: string | null
  producerName: string | null
  coverUrl: string | null
  audioFormat: string
  audioSizeBytes: bigint | null
  downloadCount: number
  publishedAt: Date | null
  artist: {
    id: string
    slug: string
    name: string
    bio: string | null
    photoUrl: string | null
  }
}): TrackPublic {
  return {
    ...raw,
    audioSizeBytes: raw.audioSizeBytes?.toString() ?? null,
    publishedAt: raw.publishedAt?.toISOString() ?? null,
  }
}

// ── Queries ───────────────────────────────────────────────────

export type TrackSortBy = 'recent' | 'name' | 'artist' | 'downloads'

export interface ListTracksOptions {
  page?: number
  perPage?: number
  genre?: string
  artistSlug?: string
  q?: string
  /** Se true, ignora a janela de exibição (24/36/48h) e traz todo o histórico publicado. */
  includeExpired?: boolean
  /** Ordenação — só usada nas páginas de gênero (catálogo completo). */
  sortBy?: TrackSortBy
}

const SORT_ORDER_BY = {
  recent: { publishedAt: 'desc' as const },
  name: { title: 'asc' as const },
  artist: { artist: { name: 'asc' as const } },
  downloads: { downloadCount: 'desc' as const },
} satisfies Record<TrackSortBy, object>

export async function listTracks(opts: ListTracksOptions = {}) {
  const { page = 1, perPage = 24, genre, artistSlug, q, includeExpired = false, sortBy = 'recent' } = opts
  const skip = (page - 1) * perPage
  const cutoff = includeExpired ? null : await getContentCutoffDate()

  const where = {
    published: true,
    ...(cutoff && { publishedAt: { gte: cutoff } }),
    ...(genre && { genre }),
    ...(artistSlug && { artist: { slug: artistSlug } }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { producerName: { contains: q, mode: 'insensitive' as const } },
        { artist: { name: { contains: q, mode: 'insensitive' as const } } },
      ],
    }),
  }

  const [raws, total] = await Promise.all([
    prisma.track.findMany({
      where,
      select: TRACK_SELECT,
      orderBy: SORT_ORDER_BY[sortBy],
      skip,
      take: perPage,
    }),
    prisma.track.count({ where }),
  ])

  return {
    tracks: raws.map(serializeTrack),
    total,
    page,
    perPage,
    hasMore: skip + raws.length < total,
  }
}

// Página de detalhe é acessível por link direto (ex.: a partir do histórico
// em /musicas-recentes) mesmo após a faixa saí da janela de exibição —
// por isso não aplica o corte de 24/36/48h aqui.
export async function getTrackBySlug(slug: string): Promise<TrackPublic | null> {
  const raw = await prisma.track.findFirst({
    where: { slug, published: true },
    select: TRACK_SELECT,
  })

  return raw ? serializeTrack(raw) : null
}

export async function listGenres(includeExpired = false): Promise<string[]> {
  const cutoff = includeExpired ? null : await getContentCutoffDate()
  const rows = await prisma.track.findMany({
    where: { published: true, ...(cutoff && { publishedAt: { gte: cutoff } }), genre: { not: null } },
    select: { genre: true },
    distinct: ['genre'],
    orderBy: { genre: 'asc' },
  })

  return rows.map((r) => r.genre!).filter(Boolean)
}

/** As N músicas publicadas mais recentes (ainda dentro da janela de exibição). */
export async function listLatestTracks(limit: number): Promise<TrackPublic[]> {
  const cutoff = await getContentCutoffDate()
  const raws = await prisma.track.findMany({
    where: { published: true, publishedAt: { gte: cutoff } },
    select: TRACK_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  })
  return raws.map(serializeTrack)
}
