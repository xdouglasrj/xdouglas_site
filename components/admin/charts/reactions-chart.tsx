import type { ReactionSummaryItem } from '@/lib/social/track-reactions'

// ============================================================
// ReactionsChart (V3 Plano 15) — distribuição simples de reações
// no analytics admin da faixa. Molde do DeviceOsChart (barras).
// ============================================================

interface ReactionsChartProps {
  data: ReactionSummaryItem[]
}

export function ReactionsChart({ data }: ReactionsChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  if (total === 0) {
    return (
      <p className="text-sm text-neutral-600 py-8 text-center">
        Sem reações ainda
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
        return (
          <div key={item.emoji} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">
                <span aria-hidden="true">{item.emoji}</span>
              </span>
              <span className="text-neutral-500 tabular-nums">
                {item.count.toLocaleString('pt-BR')} · {pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-600 transition-all"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.emoji}: ${pct}%`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
