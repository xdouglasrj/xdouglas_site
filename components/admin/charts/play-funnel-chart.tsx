'use client'

import type { PlayFunnel } from '@/lib/analytics/queries'

interface PlayFunnelChartProps {
  data: PlayFunnel
}

export function PlayFunnelChart({ data }: PlayFunnelChartProps) {
  const { playStarts, play30s, playComplete, under30s } = data

  if (playStarts === 0) {
    return (
      <p className="text-sm text-neutral-600 py-8 text-center">
        Sem reproduções registradas ainda
      </p>
    )
  }

  const rows = [
    { label: 'Iniciaram a reprodução', value: playStarts, color: 'bg-violet-600' },
    { label: 'Ouviram menos de 30s', value: under30s, color: 'bg-amber-600' },
    { label: 'Ouviram 30s ou mais', value: play30s, color: 'bg-rose-600' },
    { label: 'Completaram a faixa', value: playComplete, color: 'bg-emerald-600' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const pct = playStarts > 0 ? Math.round((row.value / playStarts) * 100) : 0
        return (
          <div key={row.label} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">{row.label}</span>
              <span className="text-neutral-500 tabular-nums">
                {row.value.toLocaleString('pt-BR')} · {pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${row.color}`}
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${row.label}: ${pct}%`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
