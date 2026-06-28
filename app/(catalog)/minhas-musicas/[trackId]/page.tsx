import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { prisma } from '@/lib/prisma'
import {
  getTrackOverview,
  getDownloadsByDay,
  getPlaysByDay,
  getDeviceOsBreakdown,
  getGeoBreakdownByTrack,
  getGeoPoints,
} from '@/lib/analytics/queries'
import { MetricCard } from '@/components/admin/metric-card'
import { ChartCard } from '@/components/admin/chart-card'
import { DownloadsChart } from '@/components/admin/charts/downloads-chart'
import { PlayFunnelChart } from '@/components/admin/charts/play-funnel-chart'
import { PlaysChart } from '@/components/admin/charts/plays-chart'
import { DeviceOsChart } from '@/components/admin/charts/device-os-chart'
import { GeoRankingTable } from '@/components/admin/geo-ranking-table'
import { GeoScatterChart } from '@/components/admin/charts/geo-scatter-chart'

export const metadata: Metadata = {
  title: 'Estatísticas da faixa',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ trackId: string }>
  searchParams: Promise<{ days?: string }>
}

export default async function TrackAnalyticsPage({ params, searchParams }: PageProps) {
  const { trackId } = await params
  const { days: daysParam } = await searchParams
  const days = Math.min(90, Math.max(7, Number(daysParam ?? '30')))

  const user = await getCurrentUserBasics()
  const canAccess = user?.mappingEnabled || user?.role === 'ADMIN'
  if (!user || !canAccess) redirect('/inicio')

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true, title: true, submittedById: true },
  })
  if (!track) notFound()

  // Mesmo com Mapeamento ativado, só vê estatísticas das próprias faixas
  // (admin pode ver qualquer uma).
  const isOwner = track.submittedById === user.id
  const isAdmin = user.role === 'ADMIN'
  if (!isOwner && !isAdmin) notFound()

  const [overview, downloadsByDay, playsByDay, deviceOsBreakdown, geoBreakdown, geoPoints] =
    await Promise.all([
      getTrackOverview(trackId, days),
      getDownloadsByDay(days, trackId),
      getPlaysByDay(days, trackId),
      getDeviceOsBreakdown(days, trackId),
      getGeoBreakdownByTrack(trackId, days),
      getGeoPoints(trackId, days),
    ])

  const { playFunnel } = overview
  const completionPct =
    playFunnel.playStarts > 0
      ? Math.round((playFunnel.playComplete / playFunnel.playStarts) * 100)
      : 0
  const under30Pct =
    playFunnel.playStarts > 0
      ? Math.round((playFunnel.under30s / playFunnel.playStarts) * 100)
      : 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white truncate">{track.title}</h1>
        <p className="mt-1 text-sm text-gate-blue">
          Estatísticas detalhadas · últimos {days} dias
        </p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Downloads" value={overview.downloads} sub={`últimos ${days}d`} highlight />
        <MetricCard label="Reproduções iniciadas" value={playFunnel.playStarts} sub={`últimos ${days}d`} />
        <MetricCard label="Completaram" value={completionPct} sub="% de quem iniciou" />
        <MetricCard label="Ouviram menos de 30s" value={under30Pct} sub="% de quem iniciou" />
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

      {/* Downloads por dia + dispositivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Downloads por dia">
          <DownloadsChart data={downloadsByDay} />
        </ChartCard>
        <ChartCard title="Dispositivos e sistema">
          <DeviceOsChart data={deviceOsBreakdown} />
        </ChartCard>
      </div>

      {/* Geo: ranking + mapa de pontos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="De onde ouvem/baixam">
          <GeoRankingTable data={geoBreakdown} />
        </ChartCard>
        <ChartCard title="Mapa de pontos (lat/long)">
          <GeoScatterChart data={geoPoints} />
        </ChartCard>
      </div>
    </div>
  )
}
