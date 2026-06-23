'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DailyCount } from '@/lib/analytics/queries'

interface DownloadsChartProps {
  data: DailyCount[]
}

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs shadow-lg">
      <p className="text-neutral-400 mb-1">{label ? formatDate(label) : ''}</p>
      <p className="font-semibold text-white">
        {payload[0].value.toLocaleString('pt-BR')} download
        {payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function DownloadsChart({ data }: DownloadsChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    label: formatDate(d.date),
    downloads: d.count,
  }))

  // Mostra apenas alguns labels no eixo X para não poluir
  const tickInterval = Math.floor(chartData.length / 6)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="downloadsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#262626"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: '#737373', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
        />
        <YAxis
          tick={{ fill: '#737373', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#404040', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="downloads"
          stroke="#e11d48"
          strokeWidth={2}
          fill="url(#downloadsGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#e11d48', stroke: '#171717', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
