'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { GeoPoint } from '@/lib/analytics/queries'

interface GeoScatterChartProps {
  data: GeoPoint[]
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: GeoPoint }[]
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs shadow-lg">
      <p className="text-neutral-400">
        {point.latitude.toFixed(2)}, {point.longitude.toFixed(2)}
      </p>
      <p className="font-semibold text-white">
        {point.count.toLocaleString('pt-BR')} ocorrência{point.count !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function GeoScatterChart({ data }: GeoScatterChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-neutral-600 py-8 text-center">
        Sem coordenadas registradas ainda
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
        <XAxis
          type="number"
          dataKey="longitude"
          name="Longitude"
          domain={['auto', 'auto']}
          tick={{ fill: '#737373', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="number"
          dataKey="latitude"
          name="Latitude"
          domain={['auto', 'auto']}
          tick={{ fill: '#737373', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <ZAxis type="number" dataKey="count" range={[40, 400]} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#404040', strokeDasharray: '3 3' }} />
        <Scatter data={data} fill="#e11d48" fillOpacity={0.6} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
