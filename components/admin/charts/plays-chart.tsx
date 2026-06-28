'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { PlaysByDay } from '@/lib/analytics/queries'

interface PlaysChartProps {
  data: PlaysByDay[]
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
  payload?: { value: number; name: string; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs shadow-lg">
      <p className="text-neutral-400 mb-1">{label ? formatDate(label) : ''}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString('pt-BR')}
        </p>
      ))}
    </div>
  )
}

export function PlaysChart({ data }: PlaysChartProps) {
  const chartData = data.map((d) => ({
    label: formatDate(d.date),
    'Iniciaram': d.playStarts,
    '30s+': d.play30s,
    'Completaram': d.playComplete,
  }))

  const tickInterval = Math.floor(chartData.length / 6)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
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
        <Legend wrapperStyle={{ fontSize: 11, color: '#a3a3a3' }} />
        <Bar dataKey="Iniciaram" fill="#7c3aed" radius={[3, 3, 0, 0]} maxBarSize={16} />
        <Bar dataKey="30s+" fill="#e11d48" radius={[3, 3, 0, 0]} maxBarSize={16} />
        <Bar dataKey="Completaram" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}
