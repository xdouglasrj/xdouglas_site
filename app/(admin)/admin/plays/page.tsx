import type { Metadata } from 'next'
import { Suspense } from 'react'
import {
  getPlayFunnel,
  getPlaysByDay,
  getDeviceOsBreakdown,
  getAllTracksPlayStats,
} from '@/lib/analytics/queries'
import { MetricCard } from '@/components/admin/metric-card'
import { ChartCard } from '@/components/admin/chart-card'
import { PlayFunnelChart } from '@/components/admin/charts/play-funnel-chart'
import { PlaysChart } from '@/components/admin/charts/plays-chart'
import { DeviceOsChart } from '@/components/admin/charts/device-os-chart'
import { PeriodSelector } from '@/components/admin/period-selector'
import { AdminSearchBar } from '@/components/admin/admin-search-bar'
import { TrackPlaysTable } from '@/components/admin/track-plays-table'

export const metadata: Metadata = { title: 'Plays' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ days?: string; q?: string }>
}

export default async function AdminPlaysPage({ searchParams }: PageProps) {
  const { days: daysParam, q } = await searchParams
  const days = Math.min(90, Math.max(7, Number(daysParam ?? '30')))
  const query = q?.trim() || undefined

  const [playFunnel, playsByDay, deviceOsBreakdown, tracks] = await Promise.all([
    getPlayFunnel(days),
    getPlaysByDay(days),
    getDeviceOsBreakdown(days),
    getAllTracksPlayStats(days, query),
  ])

  const completionPct =
    playFunnel.playStarts > 0
      ? Math.round((playFunnel.playComplete / playFunnel.playStarts) * 100)
      : 0
  const under30Pct =
    playFunnel.playStarts > 0
      ? Math.round((playFunnel.under30s / playFunnel.playStarts) * 100)
      : 0
  const tracksWithPlays = tracks.filter((t) => t.playStarts > 0).length

  return (
    <div className="max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Plays</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Analítico de reproduções de todas as músicas · últimos {days} dias
          </p>
        </div>
        <Suspense>
          <PeriodSelector basePath="/admin/plays" />
        </Suspense>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Reproduções iniciadas"
          value={playFunnel.playStarts}
          sub={`últimos ${days}d`}
          highlight
        />
        <MetricCard label="Completaram" value={completionPct} sub="% de quem iniciou" />
        <MetricCard label="Ouviram menos de 30s" value={under30Pct} sub="% de quem iniciou" />
        <MetricCard label="Músicas com plays" value={tracksWithPlays} sub={`de ${tracks.length} no total`} />
      </div>

      {/* Funil de plays + reproduções por dia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Funil de reprodução">
          <PlayFunnelChart data={playFunnel} />
        </ChartCard>
        <ChartCard title="Reproduções por dia">
          <PlaysChart data={playsByDay} />
        </ChartCard>
      </div>

      {/* Dispositivos e sistema */}
      <div className="mb-8">
        <ChartCard title="Dispositivos e sistema">
          <DeviceOsChart data={deviceOsBreakdown} />
        </ChartCard>
      </div>

      {/* Detalhamento por música, com busca */}
      <div className="mb-2">
        <h2 className="text-base font-medium text-white mb-1">Detalhamento por música</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Busque uma faixa para ver suas reproduções, ou clique em &quot;Ver detalhes&quot; para o
          analítico completo (geo, dispositivos, downloads).
        </p>
        <AdminSearchBar
          defaultValue={query}
          placeholder="Buscar música ou artista..."
          extraParams={{ days: String(days) }}
        />
      </div>
      <TrackPlaysTable tracks={tracks} query={query} />
    </div>
  )
}
