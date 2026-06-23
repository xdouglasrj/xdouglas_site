'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DailyCount } from '@/lib/analytics/queries'

interface VisitorsChartProps {
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
        {payload[0].value.toLocaleString('pt-BR')} visitante
        {payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function VisitorsChart({ data }: VisitorsChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    label: formatDate(d.date),
    visitors: d.count,
  }))

  const tickInterval = Math.floor(chartData.length / 6)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#262626' }} />
        <Bar
          dataKey="visitors"
          fill="#7c3aed"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
