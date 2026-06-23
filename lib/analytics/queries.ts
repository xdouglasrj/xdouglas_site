import { prisma } from '@/lib/prisma'

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

/** Downloads por dia nos últimos N dias (padrão 30) */
export async function getDownloadsByDay(days = 30): Promise<DailyCount[]> {
  const since = daysAgo(days)

  // Prisma não tem groupBy por dia nativamente — usa queryRaw
  const rows = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT
      DATE_TRUNC('day', created_at)::date::text AS date,
      COUNT(*)::bigint AS count
    FROM downloads
    WHERE
      download_suspeito = false
      AND created_at >= ${since}
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
