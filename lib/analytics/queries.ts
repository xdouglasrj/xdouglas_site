import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// ============================================================
// Queries de analytics — SEMPRE filtram download_suspeito=false
// Baseadas em analytics_events (camada 2, sem IP, permanente)
// ============================================================

// ── Tipos de retorno ─────────────────────────────────────────

export interface DailyCount {
  date: string   // ISO "YYYY-MM-DD"
  count: number
}

export interface TopTrack {
  trackId: string
  title: string
  artistName: string
  coverUrl: string | null
  downloads: number
}

export interface DeviceBreakdown {
  device: string
  count: number
  pct: number
}

export interface CountryCount {
  country: string
  count: number
}

export interface PlayFunnel {
  playStarts: number
  play30s: number
  playComplete: number
  under30s: number   // playStarts - play30s (ouviu menos de 30s)
}

export interface PlaysByDay {
  date: string
  playStarts: number
  play30s: number
  playComplete: number
}

export interface DeviceOsBreakdown {
  device: string
  os: string
  label: string
  count: number
  pct: number
}

export interface GeoBreakdown {
  country: string
  region: string
  city: string
  count: number
}

export interface GeoPoint {
  latitude: number
  longitude: number
  count: number
}

export interface TrackOverview {
  downloads: number
  playFunnel: PlayFunnel
  topCountry: string | null
}

export interface TrackPlayStats {
  trackId: string
  slug: string
  title: string
  artistName: string
  coverUrl: string | null
  published: boolean
  playStarts: number
  play30s: number
  playComplete: number
  completionPct: number
}

export interface DashboardSummary {
  totalVisitors: number        // page_view únicos por sessionId nos últimos 30 dias
  totalDownloads: number       // downloads não suspeitos, todos os tempos
  downloadsLast30: number
  visitorsLast30: number
  newWaitlist: number          // entradas na waitlist nos últimos 30 dias
}

// ── Helpers ───────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Preenche lacunas num array de contagens diárias com zeros */
function fillGaps(data: DailyCount[], days: number): DailyCount[] {
  const map = new Map(data.map((d) => [d.date, d.count]))
  const result: DailyCount[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = toDateStr(d)
    result.push({ date: key, count: map.get(key) ?? 0 })
  }
  return result
}

// ── Queries públicas ──────────────────────────────────────────

/** Resumo para os cards do topo do dashboard */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const since30 = daysAgo(30)

  const [
    totalDownloads,
    downloadsLast30,
    visitorsLast30Raw,
    totalVisitorsRaw,
    newWaitlist,
  ] = await Promise.all([
    // Total histórico de downloads não suspeitos
    prisma.download.count({ where: { downloadSuspeito: false } }),

    // Downloads últimos 30 dias
    prisma.download.count({
      where: { downloadSuspeito: false, createdAt: { gte: since30 } },
    }),

    // Visitantes únicos últimos 30 dias (sessionId distintos)
    prisma.analyticsEvent.groupBy({
      by: ['sessionId'],
      where: {
        eventType: 'PAGE_VIEW',
        createdAt: { gte: since30 },
        sessionId: { not: null },
      },
      _count: true,
    }),

    // Visitantes únicos históricos
    prisma.analyticsEvent.groupBy({
      by: ['sessionId'],
      where: {
        eventType: 'PAGE_VIEW',
        sessionId: { not: null },
      },
      _count: true,
    }),

    // Waitlist últimos 30 dias
    prisma.waitlist.count({ where: { createdAt: { gte: since30 } } }),
  ])

  return {
    totalDownloads,
    downloadsLast30,
    visitorsLast30: visitorsLast30Raw.length,
    totalVisitors: totalVisitorsRaw.length,
    newWaitlist,
  }
}

/** Downloads por dia nos últimos N dias (padrão 30) — global ou por faixa */
export async function getDownloadsByDay(days = 30, trackId?: string): Promise<DailyCount[]> {
  const since = daysAgo(days)
  const trackFilter = trackId ? Prisma.sql`AND track_id = ${trackId}` : Prisma.empty

  // Prisma não tem groupBy por dia nativamente — usa queryRaw
  const rows = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT
      DATE_TRUNC('day', created_at)::date::text AS date,
      COUNT(*)::bigint AS count
    FROM downloads
    WHERE
      download_suspeito = false
      AND created_at >= ${since}
      ${trackFilter}
    GROUP BY 1
    ORDER BY 1
  `

  const data: DailyCount[] = rows.map((r) => ({
    date: r.date,
    count: Number(r.count),
  }))

  return fillGaps(data, days)
}

/** Visitantes únicos (page_view) por dia nos últimos N dias */
export async function getVisitorsByDay(days = 30): Promise<DailyCount[]> {
  const since = daysAgo(days)

  const rows = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT
      DATE_TRUNC('day', created_at)::date::text AS date,
      COUNT(DISTINCT session_id)::bigint AS count
    FROM analytics_events
    WHERE
      event_type = 'PAGE_VIEW'
      AND created_at >= ${since}
      AND session_id IS NOT NULL
    GROUP BY 1
    ORDER BY 1
  `

  const data: DailyCount[] = rows.map((r) => ({
    date: r.date,
    count: Number(r.count),
  }))

  return fillGaps(data, days)
}

/** Top N músicas por downloads não suspeitos */
export async function getTopTracks(limit = 10): Promise<TopTrack[]> {
  const rows = await prisma.$queryRaw<{
    track_id: string
    title: string
    artist_name: string
    cover_url: string | null
    downloads: bigint
  }[]>`
    SELECT
      d.track_id,
      t.title,
      a.name AS artist_name,
      t.cover_url,
      COUNT(d.id)::bigint AS downloads
    FROM downloads d
    JOIN tracks t ON t.id = d.track_id
    JOIN artists a ON a.id = t.artist_id
    WHERE d.download_suspeito = false
    GROUP BY d.track_id, t.title, a.name, t.cover_url
    ORDER BY downloads DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    trackId: r.track_id,
    title: r.title,
    artistName: r.artist_name,
    coverUrl: r.cover_url,
    downloads: Number(r.downloads),
  }))
}

/** Breakdown de dispositivos nos últimos 30 dias */
export async function getDeviceBreakdown(days = 30): Promise<DeviceBreakdown[]> {
  const since = daysAgo(days)

  const rows = await prisma.$queryRaw<{ device: string; count: bigint }[]>`
    SELECT
      COALESCE(device, 'unknown') AS device,
      COUNT(*)::bigint AS count
    FROM analytics_events
    WHERE
      event_type = 'PAGE_VIEW'
      AND created_at >= ${since}
    GROUP BY 1
    ORDER BY count DESC
  `

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0)

  return rows.map((r) => ({
    device: r.device,
    count: Number(r.count),
    pct: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
  }))
}

/** Top países por downloads nos últimos 30 dias */
export async function getTopCountries(
  days = 30,
  limit = 10
): Promise<CountryCount[]> {
  const since = daysAgo(days)

  const rows = await prisma.$queryRaw<{ country: string; count: bigint }[]>`
    SELECT
      COALESCE(country, 'Desconhecido') AS country,
      COUNT(*)::bigint AS count
    FROM downloads
    WHERE
      download_suspeito = false
      AND created_at >= ${since}
    GROUP BY 1
    ORDER BY count DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    country: r.country,
    count: Number(r.count),
  }))
}

/** Funil de reprodução (início / 30s / completo) — global ou por faixa */
export async function getPlayFunnel(days = 30, trackId?: string): Promise<PlayFunnel> {
  const since = daysAgo(days)
  const trackFilter = trackId ? Prisma.sql`AND track_id = ${trackId}` : Prisma.empty

  const rows = await prisma.$queryRaw<{ event_type: string; count: bigint }[]>`
    SELECT event_type, COUNT(*)::bigint AS count
    FROM analytics_events
    WHERE event_type IN ('PLAY_START', 'PLAY_30S', 'PLAY_COMPLETE')
      AND created_at >= ${since}
      ${trackFilter}
    GROUP BY 1
  `

  const map = new Map(rows.map((r) => [r.event_type, Number(r.count)]))
  const playStarts = map.get('PLAY_START') ?? 0
  const play30s = map.get('PLAY_30S') ?? 0
  const playComplete = map.get('PLAY_COMPLETE') ?? 0

  return {
    playStarts,
    play30s,
    playComplete,
    under30s: Math.max(0, playStarts - play30s),
  }
}

/** Série diária do funil de reprodução — global ou por faixa */
export async function getPlaysByDay(days = 30, trackId?: string): Promise<PlaysByDay[]> {
  const since = daysAgo(days)
  const trackFilter = trackId ? Prisma.sql`AND track_id = ${trackId}` : Prisma.empty

  const rows = await prisma.$queryRaw<{ date: string; event_type: string; count: bigint }[]>`
    SELECT
      DATE_TRUNC('day', created_at)::date::text AS date,
      event_type,
      COUNT(*)::bigint AS count
    FROM analytics_events
    WHERE event_type IN ('PLAY_START', 'PLAY_30S', 'PLAY_COMPLETE')
      AND created_at >= ${since}
      ${trackFilter}
    GROUP BY 1, 2
    ORDER BY 1
  `

  const byDate = new Map<string, PlaysByDay>()
  for (const r of rows) {
    const entry =
      byDate.get(r.date) ?? { date: r.date, playStarts: 0, play30s: 0, playComplete: 0 }
    if (r.event_type === 'PLAY_START') entry.playStarts = Number(r.count)
    if (r.event_type === 'PLAY_30S') entry.play30s = Number(r.count)
    if (r.event_type === 'PLAY_COMPLETE') entry.playComplete = Number(r.count)
    byDate.set(r.date, entry)
  }

  const result: PlaysByDay[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = toDateStr(d)
    result.push(byDate.get(key) ?? { date: key, playStarts: 0, play30s: 0, playComplete: 0 })
  }
  return result
}

/** Breakdown combinado device+OS (ex: mobile/iOS, desktop/Windows) — global ou por faixa */
export async function getDeviceOsBreakdown(
  days = 30,
  trackId?: string
): Promise<DeviceOsBreakdown[]> {
  const since = daysAgo(days)
  const trackFilter = trackId ? Prisma.sql`AND track_id = ${trackId}` : Prisma.empty

  const rows = await prisma.$queryRaw<{ device: string; os: string; count: bigint }[]>`
    SELECT
      COALESCE(device, 'unknown') AS device,
      COALESCE(os, 'outro') AS os,
      COUNT(*)::bigint AS count
    FROM analytics_events
    WHERE event_type IN ('PAGE_VIEW', 'MUSIC_VIEW', 'PLAY_START')
      AND created_at >= ${since}
      ${trackFilter}
    GROUP BY 1, 2
    ORDER BY count DESC
  `

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0)

  return rows.map((r) => ({
    device: r.device,
    os: r.os,
    label: `${r.device} / ${r.os}`,
    count: Number(r.count),
    pct: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
  }))
}

/** Ranking geográfico (país/região/cidade) de uma faixa — combina downloads + plays */
export async function getGeoBreakdownByTrack(
  trackId: string,
  days = 30
): Promise<GeoBreakdown[]> {
  const since = daysAgo(days)

  const rows = await prisma.$queryRaw<
    { country: string; region: string; city: string; count: bigint }[]
  >`
    SELECT
      COALESCE(country, 'Desconhecido') AS country,
      COALESCE(region, 'Desconhecida') AS region,
      COALESCE(city, 'Desconhecida') AS city,
      COUNT(*)::bigint AS count
    FROM downloads
    WHERE track_id = ${trackId} AND download_suspeito = false AND created_at >= ${since}
    GROUP BY 1, 2, 3
    UNION ALL
    SELECT
      COALESCE(country, 'Desconhecido') AS country,
      COALESCE(region, 'Desconhecida') AS region,
      COALESCE(city, 'Desconhecida') AS city,
      COUNT(*)::bigint AS count
    FROM analytics_events
    WHERE track_id = ${trackId} AND event_type = 'PLAY_START' AND created_at >= ${since}
    GROUP BY 1, 2, 3
  `

  const map = new Map<string, GeoBreakdown>()
  for (const r of rows) {
    const key = `${r.country}|${r.region}|${r.city}`
    const existing = map.get(key)
    if (existing) existing.count += Number(r.count)
    else map.set(key, { country: r.country, region: r.region, city: r.city, count: Number(r.count) })
  }

  return [...map.values()].sort((a, b) => b.count - a.count)
}

/** Pontos lat/long agregados de uma faixa (downloads + plays), para o mapa de pontos */
export async function getGeoPoints(trackId: string, days = 30): Promise<GeoPoint[]> {
  const since = daysAgo(days)

  const rows = await prisma.$queryRaw<{ latitude: number; longitude: number; count: bigint }[]>`
    SELECT latitude, longitude, SUM(count)::bigint AS count FROM (
      SELECT latitude, longitude, COUNT(*)::bigint AS count
      FROM downloads
      WHERE track_id = ${trackId} AND download_suspeito = false AND created_at >= ${since}
        AND latitude IS NOT NULL AND longitude IS NOT NULL
      GROUP BY 1, 2
      UNION ALL
      SELECT latitude, longitude, COUNT(*)::bigint AS count
      FROM analytics_events
      WHERE track_id = ${trackId} AND created_at >= ${since}
        AND latitude IS NOT NULL AND longitude IS NOT NULL
      GROUP BY 1, 2
    ) combined
    GROUP BY 1, 2
  `

  return rows.map((r) => ({
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    count: Number(r.count),
  }))
}

/** Estatísticas de reprodução por faixa (todas as músicas), com busca por título/artista */
export async function getAllTracksPlayStats(days = 30, search?: string): Promise<TrackPlayStats[]> {
  const since = daysAgo(days)
  const term = search?.trim()
  const searchFilter = term
    ? Prisma.sql`AND (t.title ILIKE ${'%' + term + '%'} OR a.name ILIKE ${'%' + term + '%'})`
    : Prisma.empty

  const rows = await prisma.$queryRaw<{
    track_id: string
    slug: string
    title: string
    artist_name: string
    cover_url: string | null
    published: boolean
    play_starts: bigint
    play_30s: bigint
    play_complete: bigint
  }[]>`
    SELECT
      t.id AS track_id,
      t.slug,
      t.title,
      a.name AS artist_name,
      t.cover_url,
      t.published,
      COALESCE(SUM(CASE WHEN e.event_type = 'PLAY_START' THEN 1 ELSE 0 END), 0)::bigint AS play_starts,
      COALESCE(SUM(CASE WHEN e.event_type = 'PLAY_30S' THEN 1 ELSE 0 END), 0)::bigint AS play_30s,
      COALESCE(SUM(CASE WHEN e.event_type = 'PLAY_COMPLETE' THEN 1 ELSE 0 END), 0)::bigint AS play_complete
    FROM tracks t
    JOIN artists a ON a.id = t.artist_id
    LEFT JOIN analytics_events e
      ON e.track_id = t.id
      AND e.event_type IN ('PLAY_START', 'PLAY_30S', 'PLAY_COMPLETE')
      AND e.created_at >= ${since}
    WHERE 1=1 ${searchFilter}
    GROUP BY t.id, t.slug, t.title, a.name, t.cover_url, t.published
    ORDER BY play_starts DESC, t.title ASC
  `

  return rows.map((r) => {
    const playStarts = Number(r.play_starts)
    const playComplete = Number(r.play_complete)
    return {
      trackId: r.track_id,
      slug: r.slug,
      title: r.title,
      artistName: r.artist_name,
      coverUrl: r.cover_url,
      published: r.published,
      playStarts,
      play30s: Number(r.play_30s),
      playComplete,
      completionPct: playStarts > 0 ? Math.round((playComplete / playStarts) * 100) : 0,
    }
  })
}

/** Resumo de uma faixa específica para o dashboard do artista */
export async function getTrackOverview(trackId: string, days = 30): Promise<TrackOverview> {
  const since = daysAgo(days)

  const [downloads, playFunnel, geo] = await Promise.all([
    prisma.download.count({
      where: { trackId, downloadSuspeito: false, createdAt: { gte: since } },
    }),
    getPlayFunnel(days, trackId),
    getGeoBreakdownByTrack(trackId, days),
  ])

  return {
    downloads,
    playFunnel,
    topCountry: geo[0]?.country ?? null,
  }
}
