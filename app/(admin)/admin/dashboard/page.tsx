import type { Metadata } from 'next'
import { Suspense } from 'react'
import {
  getDashboardSummary,
  getDownloadsByDay,
  getVisitorsByDay,
  getTopTracks,
  getTopCountries,
  getDeviceOsBreakdown,
  getPlayFunnel,
  getPlaysByDay,
} from '@/lib/analytics/queries'
import { prisma } from '@/lib/prisma'
import { DownloadsChart } from '@/components/admin/charts/downloads-chart'
import { VisitorsChart } from '@/components/admin/charts/visitors-chart'
import { DeviceOsChart } from '@/components/admin/charts/device-os-chart'
import { PlayFunnelChart } from '@/components/admin/charts/play-funnel-chart'
import { PlaysChart } from '@/components/admin/charts/plays-chart'
import { TopTracksTable } from '@/components/admin/top-tracks-table'
import { RecentDownloadsFeed } from '@/components/admin/recent-downloads-feed'
import { PeriodSelector } from '@/components/admin/period-selector'
import { MetricCard } from '@/components/admin/metric-card'
import { ChartCard } from '@/components/admin/chart-card'

export const metadata: Metadata = { title: 'Dashboard' }

// Não fazer cache — dados em tempo real
export const dynamic = 'force-dynamic'

// ── Tipos ─────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ days?: string }>
}

// ── Página ────────────────────────────────────────────────────

export default async function DashboardPage({ searchParams }: PageProps) {
  const { days: daysParam } = await searchParams
  const days = Math.min(90, Math.max(7, Number(daysParam ?? '30')))

  // Todas as queries em paralelo
  const [
    summary,
    downloadsByDay,
    visitorsByDay,
    topTracks,
    deviceOsBreakdown,
    topCountries,
    playFunnel,
    playsByDay,
    totalTracks,
    suspiciousCount,
    recentDownloads,
  ] = await Promise.all([
    getDashboardSummary(),
    getDownloadsByDay(days),
    getVisitorsByDay(days),
    getTopTracks(10),
    getDeviceOsBreakdown(days),
    getTopCountries(days, 8),
    getPlayFunnel(days),
    getPlaysByDay(days),
    prisma.track.count({ where: { published: true } }),
    prisma.download.count({
      where: {
        downloadSuspeito: true,
        createdAt: { gte: new Date(Date.now() - 30 * 86400_000) },
      },
    }),
    prisma.download.findMany({
      where: { downloadSuspeito: false },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        country: true,
        city: true,
        device: true,
        createdAt: true,
        track: { select: { title: true, slug: true } },
      },
    }),
  ])

  const recentDownloadsSerialized = recentDownloads.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Dados em tempo real · últimos {days} dias
          </p>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard
          label="Músicas"
          value={totalTracks}
          sub="publicadas"
        />
        <MetricCard
          label="Downloads"
          value={summary.downloadsLast30}
          sub={`últimos ${days}d`}
          highlight
        />
        <MetricCard
          label="Total downloads"
          value={summary.totalDownloads}
          sub="histórico"
        />
        <MetricCard
          label="Visitantes"
          value={summary.visitorsLast30}
          sub={`últimos ${days}d`}
        />
        <MetricCard
          label="Lista de espera"
          value={summary.newWaitlist}
          sub="últimos 30d"
        />
      </div>

      {/* Gráficos principais — linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Downloads por dia">
          <DownloadsChart data={downloadsByDay} />
        </ChartCard>

        <ChartCard title="Visitantes únicos por dia">
          <VisitorsChart data={visitorsByDay} />
        </ChartCard>
      </div>

      {/* Linha 2 — funil de plays + plays por dia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Funil de reprodução">
          <PlayFunnelChart data={playFunnel} />
        </ChartCard>

        <ChartCard title="Reproduções por dia">
          <PlaysChart data={playsByDay} />
        </ChartCard>
      </div>

      {/* Linha 3 — tabelas e breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Top músicas — ocupa 2 colunas */}
        <div className="lg:col-span-2">
          <ChartCard title="Músicas mais baixadas">
            <TopTracksTable tracks={topTracks} />
          </ChartCard>
        </div>

        {/* Dispositivos + sistema operacional */}
        <ChartCard title="Dispositivos e sistema">
          <DeviceOsChart data={deviceOsBreakdown} />
        </ChartCard>
      </div>

      {/* Linha 4 — países + feed recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top países">
          <CountriesTable data={topCountries} />
        </ChartCard>

        <ChartCard title="Atividade recente">
          <RecentDownloadsFeed downloads={recentDownloadsSerialized} />
        </ChartCard>
      </div>

      {/* Alerta de segurança — só aparece se houver suspeitos */}
      {suspiciousCount > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-800/60 bg-amber-950/20 px-4 py-3">
          <span className="text-amber-500 text-base" aria-hidden="true">⚠</span>
          <p className="text-sm text-amber-400">
            <strong className="font-semibold">{suspiciousCount.toLocaleString('pt-BR')}</strong>{' '}
            download{suspiciousCount !== 1 ? 's' : ''} suspeito
            {suspiciousCount !== 1 ? 's' : ''} nos últimos 30 dias foram sinalizados e excluídos das métricas.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────

function CountriesTable({
  data,
}: {
  data: { country: string; count: number }[]
}) {
  const max = data[0]?.count ?? 1

  if (data.length === 0) {
    return (
      <p className="text-sm text-neutral-600 py-8 text-center">
        Sem dados de países ainda
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((item) => (
        <div key={item.country} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-sm text-neutral-400 truncate">
            {item.country}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-600"
              style={{ width: `${Math.round((item.count / max) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500 tabular-nums w-10 text-right">
            {item.count.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}
