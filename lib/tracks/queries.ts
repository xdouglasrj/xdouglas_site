import { prisma } from '@/lib/prisma'
import { getContentCutoffDate } from '@/lib/settings/content-expiration'
import type { TrackPublic } from './types'

// ============================================================
// Select seguro — nunca expõe audioKey, coverKey nem IDs internos
// sensíveis. coverUrl é a URL pública CDN, ok expor.
// ============================================================

export const TRACK_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  genre: true,
  bpm: true,
  key: true,
  mood: true,
  tags: true,
  durationSeconds: true,
  kind: true,
  downloadMode: true,
  seriesId: true,
  episodeNumber: true,
  producerName: true,
  coverUrl: true,
  audioFormat: true,
  audioSizeBytes: true,
  downloadCount: true,
  publishedAt: true,
  pinned: true,
  submittedById: true,
  artist: {
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      photoUrl: true,
      // V3 Plano 12 — userId do dono, para o mini-modal "Seguir para baixar"
      user: { select: { id: true, handle: true } },
    },
  },
  _count: { select: { likes: true, reposts: true, reactions: true } },
} as const

// ── Serialização ─────────────────────────────────────────────

// BigInt não é JSON-serializável nativamente — converte para string
export function serializeTrack(raw: {
  id: string
  slug: string
  title: string
  description: string | null
  genre: string | null
  bpm: number | null
  key: string | null
  mood: string | null
  tags: string[]
  durationSeconds: number | null
  kind: string
  downloadMode: string
  seriesId: string | null
  episodeNumber: number | null
  producerName: string | null
  coverUrl: string | null
  audioFormat: string
  audioSizeBytes: bigint | null
  downloadCount: number
  publishedAt: Date | null
  pinned: boolean
  submittedById: string | null
  artist: {
    id: string
    slug: string
    name: string
    bio: string | null
    photoUrl: string | null
    user: { id: string; handle: string | null } | null
  }
  _count: { likes: number; reposts: number; reactions: number }
}, options: { topReaction?: { emoji: string; count: number } | null } = {}): TrackPublic {
  const top = options.topReaction ?? null
  const { _count, artist, submittedById, ...rest } = raw
  const { user, ...artistRest } = artist
  // V3 Plano 12 — "dono da faixa" a ser seguido no follow-gate. Mesma
  // ordem de prioridade do getTrackOwner e da verificação no servidor.
  const ownerUserId = submittedById ?? user?.id ?? null
  return {
    ...rest,
    artist: { ...artistRest, userHandle: user?.handle ?? null, userId: ownerUserId },
    likeCount: _count.likes,
    repostCount: _count.reposts,
    topReaction: top?.emoji ?? null,
    topReactionCount: top?.count ?? 0,
    reactionCount: _count.reactions,
    audioSizeBytes: raw.audioSizeBytes?.toString() ?? null,
    publishedAt: raw.publishedAt?.toISOString() ?? null,
  }
}

// V3 Plano 15 — top emoji agregado por faixa, em lote (evita N+1). Usa
// groupBy por (trackId, emoji) e escolhe o maior count por trackId em memória.
async function getTopReactionsByTrackIds(
  trackIds: string[],
): Promise<Map<string, { emoji: string; count: number }>> {
  const best = new Map<string, { emoji: string; count: number }>()
  if (trackIds.length === 0) return best

  const grouped = await prisma.trackReaction.groupBy({
    by: ['trackId', 'emoji'],
    where: { trackId: { in: trackIds } },
    _count: { emoji: true },
  })

  for (const row of grouped) {
    const current = best.get(row.trackId)
    if (!current || row._count.emoji > current.count) {
      best.set(row.trackId, { emoji: row.emoji, count: row._count.emoji })
    }
  }

  return best
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
  recent: [{ pinned: 'desc' as const }, { publishedAt: 'desc' as const }],
  name: [{ pinned: 'desc' as const }, { title: 'asc' as const }],
  artist: [{ pinned: 'desc' as const }, { artist: { name: 'asc' as const } }],
  downloads: [{ pinned: 'desc' as const }, { downloadCount: 'desc' as const }],
} satisfies Record<TrackSortBy, object[]>

export async function listTracks(opts: ListTracksOptions = {}) {
  const { page = 1, perPage = 24, genre, artistSlug, q, includeExpired = false, sortBy = 'recent' } = opts
  const skip = (page - 1) * perPage
  const cutoff = includeExpired ? null : await getContentCutoffDate()

  const where = {
    published: true,
    // Música fixada pelo admin ignora a janela de expiração — continua
    // aparecendo no feed mesmo após o corte de 24/36/48h
    ...(cutoff && { OR: [{ pinned: true }, { publishedAt: { gte: cutoff } }] }),
    ...(genre && { genre }),
    ...(artistSlug && { artist: { slug: artistSlug } }),
    ...(q && {
      AND: [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { producerName: { contains: q, mode: 'insensitive' as const } },
            { artist: { name: { contains: q, mode: 'insensitive' as const } } },
          ],
        },
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

  const topReactions = await getTopReactionsByTrackIds(raws.map((r) => r.id))

  return {
    tracks: raws.map((raw) => serializeTrack(raw, { topReaction: topReactions.get(raw.id) ?? null })),
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
  if (!raw) return null

  const topReactions = await getTopReactionsByTrackIds([raw.id])
  return serializeTrack(raw, { topReaction: topReactions.get(raw.id) ?? null })
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
  const topReactions = await getTopReactionsByTrackIds(raws.map((r) => r.id))
  return raws.map((raw) => serializeTrack(raw, { topReaction: topReactions.get(raw.id) ?? null }))
}

// V3 Plano 16 — query pronta para uma futura seção "Sets" na home (kind=set).
// Não usada ainda em nenhuma página; deixada aqui para reuso quando o dono
// decidir criar a seção. Segue a mesma janela de exibição do restante do feed.
export async function listLatestSets(limit: number, includeExpired = false): Promise<TrackPublic[]> {
  const cutoff = includeExpired ? null : await getContentCutoffDate()
  const raws = await prisma.track.findMany({
    where: {
      published: true,
      kind: 'set',
      ...(cutoff && { publishedAt: { gte: cutoff } }),
    },
    select: TRACK_SELECT,
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    take: limit,
  })
  const topReactions = await getTopReactionsByTrackIds(raws.map((r) => r.id))
  return raws.map((raw) => serializeTrack(raw, { topReaction: topReactions.get(raw.id) ?? null }))
}
