import { unstable_cache } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { TRACK_SELECT, serializeTrack } from '@/lib/tracks/queries'
import type { TrackPublic } from '@/lib/tracks/types'

// ============================================================
// Trending (V3 Plano 4) — ranking por período/gênero + Underground.
//
// Estratégia: query direta com cache de 1h (unstable_cache). O volume
// atual (plataforma privada) não justifica tabela de snapshot; se o
// site crescer, migrar para uma TrendingSnapshot recalculada por cron
// da Vercel mantendo a MESMA interface getTrending() — só trocar o
// miolo de computeTrending por leitura do snapshot.
//
// Anti-manipulação mínima:
// - plays: no máximo 1 por sessão por faixa na janela (COUNT DISTINCT session_id)
// - likes/reposts: já são únicos por usuário (constraint no banco)
// - downloads: ignora os marcados como suspeitos (downloadSuspeito)
// - comentários: contados por linha (limitação conhecida: multi-comentário
//   do mesmo usuário conta mais de uma vez — aceito nesta versão)
//
// V3 Plano 13 — o DESTAQUE PAGO com pontos (TrackHighlight / Track.featuredUntil)
// NÃO entra na fórmula de score aqui: pagar pontos compra uma vitrine
// separada ("Em destaque"), não um empurrão no ranking algorítmico. Por
// isso nenhum sinal deste computeTrending lê featuredUntil/TrackHighlight —
// trending continua puramente orgânico (plays/likes/reposts/comments/downloads).
// ============================================================

export type TrendingPeriod = 'week' | 'month' | 'all'

export interface TrendingStats {
  plays: number
  likes: number
  reposts: number
  comments: number
  downloads: number
  score: number
}

export interface TrendingEntry {
  position: number
  track: TrackPublic
  stats: TrendingStats
}

// Pesos da fórmula — ponto único de ajuste
export const TRENDING_WEIGHTS = {
  plays: 1,
  likes: 3,
  reposts: 4,
  comments: 3,
  downloads: 2,
} as const

// Underground = artista com menos seguidores que isso E faixa sem pin do admin
export const UNDERGROUND_MAX_FOLLOWERS = 100

const TRENDING_LIMIT = 50
const CACHE_SECONDS = 60 * 60 // 1h

function periodStart(period: TrendingPeriod): Date | null {
  if (period === 'all') return null
  const days = period === 'week' ? 7 : 30
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

interface ComputeOptions {
  period: TrendingPeriod
  genre?: string | null
  underground?: boolean
}

async function computeTrending({ period, genre = null, underground = false }: ComputeOptions): Promise<TrendingEntry[]> {
  const since = periodStart(period)
  const dateFilter = since ? { createdAt: { gte: since } } : {}

  // ── Sinais da janela, cada um agregado por faixa ────────────
  const [playRows, likeRows, repostRows, commentRows, downloadRows] = await Promise.all([
    // Plays deduplicados por sessão (1 play/sessão/faixa na janela).
    // COALESCE(session_id, id): evento sem sessão (tracking antigo, sem
    // consentimento) conta 1 play cada em vez de ser descartado pelo
    // COUNT DISTINCT — sem isso, plays com session_id NULL somariam zero.
    prisma.$queryRaw<{ track_id: string; plays: bigint }[]>`
      SELECT track_id, COUNT(DISTINCT COALESCE(session_id, id)) AS plays
      FROM analytics_events
      WHERE event_type = 'PLAY_START'
        AND track_id IS NOT NULL
        ${since ? Prisma.sql`AND created_at >= ${since}` : Prisma.empty}
      GROUP BY track_id
    `,
    prisma.trackLike.groupBy({ by: ['trackId'], where: dateFilter, _count: { trackId: true } }),
    prisma.trackRepost.groupBy({ by: ['trackId'], where: dateFilter, _count: { trackId: true } }),
    prisma.trackComment.groupBy({ by: ['trackId'], where: dateFilter, _count: { trackId: true } }),
    prisma.download.groupBy({
      by: ['trackId'],
      where: { ...dateFilter, downloadSuspeito: false },
      _count: { trackId: true },
    }),
  ])

  const stats = new Map<string, TrendingStats>()
  function statsFor(trackId: string): TrendingStats {
    let s = stats.get(trackId)
    if (!s) {
      s = { plays: 0, likes: 0, reposts: 0, comments: 0, downloads: 0, score: 0 }
      stats.set(trackId, s)
    }
    return s
  }

  for (const row of playRows) statsFor(row.track_id).plays = Number(row.plays)
  for (const row of likeRows) statsFor(row.trackId).likes = row._count.trackId
  for (const row of repostRows) statsFor(row.trackId).reposts = row._count.trackId
  for (const row of commentRows) statsFor(row.trackId).comments = row._count.trackId
  for (const row of downloadRows) statsFor(row.trackId).downloads = row._count.trackId

  for (const s of stats.values()) {
    s.score =
      s.plays * TRENDING_WEIGHTS.plays +
      s.likes * TRENDING_WEIGHTS.likes +
      s.reposts * TRENDING_WEIGHTS.reposts +
      s.comments * TRENDING_WEIGHTS.comments +
      s.downloads * TRENDING_WEIGHTS.downloads
  }

  const candidateIds = [...stats.entries()]
    .filter(([, s]) => s.score > 0)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([id]) => id)

  if (candidateIds.length === 0) return []

  // ── Metadados das faixas candidatas (só publicadas) ─────────
  const rawTracks = await prisma.track.findMany({
    where: {
      id: { in: candidateIds },
      published: true,
      ...(genre ? { genre } : {}),
    },
    select: {
      ...TRACK_SELECT,
      artist: {
        select: {
          id: true,
          slug: true,
          name: true,
          bio: true,
          photoUrl: true,
          user: { select: { id: true, handle: true } },
        },
      },
    },
  })

  // ── Underground: artista pequeno e sem pin do admin ─────────
  let filtered = rawTracks
  if (underground) {
    const artistUserIds = [...new Set(rawTracks.map((t) => t.artist.user?.id).filter((id): id is string => !!id))]
    const followerRows = artistUserIds.length
      ? await prisma.follow.groupBy({
          by: ['followingId'],
          where: { followingId: { in: artistUserIds } },
          _count: { followingId: true },
        })
      : []
    const followerCount = new Map(followerRows.map((r) => [r.followingId, r._count.followingId]))

    filtered = rawTracks.filter((t) => {
      if (t.pinned) return false
      const followers = t.artist.user?.id ? followerCount.get(t.artist.user.id) ?? 0 : 0
      return followers < UNDERGROUND_MAX_FOLLOWERS
    })
  }

  // ── Ranking final na ordem de score, posições 1..N ──────────
  const byId = new Map(filtered.map((t) => [t.id, t]))
  const entries: TrendingEntry[] = []
  for (const id of candidateIds) {
    const raw = byId.get(id)
    if (!raw) continue
    entries.push({
      position: entries.length + 1,
      track: serializeTrack(raw),
      stats: stats.get(id)!,
    })
    if (entries.length >= TRENDING_LIMIT) break
  }
  return entries
}

// ── API pública com cache de 1h ──────────────────────────────

export async function getTrending(opts: ComputeOptions): Promise<TrendingEntry[]> {
  const { period, genre = null, underground = false } = opts
  const cached = unstable_cache(
    () => computeTrending({ period, genre, underground }),
    ['trending', period, genre ?? 'all-genres', underground ? 'underground' : 'geral'],
    { revalidate: CACHE_SECONDS }
  )
  return cached()
}

// ── Selo "#N desta semana" para a página da faixa ────────────

export interface TrendingBadge {
  position: number
  /** null = ranking geral; string = ranking do gênero */
  genre: string | null
}

const BADGE_TOP_N = 5

/**
 * Retorna a posição da faixa no top 5 da SEMANA (geral, ou do gênero dela
 * como fallback). Usa o mesmo cache de 1h do trending — sair do top some
 * o selo com no máximo 1h de atraso.
 *
 * Custo: a página da faixa revalida a cada 120s, mas as 1–2 leituras aqui
 * batem no cache de 1h do getTrending — a agregação SQL só roda quando o
 * cache expira (ou em cold start de instância). Se o volume crescer,
 * migrar para snapshot pré-computado (ver comentário no topo do arquivo).
 */
export async function getTrackTrendingBadge(trackId: string, trackGenre: string | null): Promise<TrendingBadge | null> {
  const general = await getTrending({ period: 'week' })
  const inGeneral = general.find((e) => e.track.id === trackId)
  if (inGeneral && inGeneral.position <= BADGE_TOP_N) {
    return { position: inGeneral.position, genre: null }
  }

  if (trackGenre) {
    const byGenre = await getTrending({ period: 'week', genre: trackGenre })
    const inGenre = byGenre.find((e) => e.track.id === trackId)
    if (inGenre && inGenre.position <= BADGE_TOP_N) {
      return { position: inGenre.position, genre: trackGenre }
    }
  }

  return null
}
