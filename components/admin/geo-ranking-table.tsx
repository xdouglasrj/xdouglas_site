import type { GeoBreakdown } from '@/lib/analytics/queries'

interface GeoRankingTableProps {
  data: GeoBreakdown[]
  limit?: number
}

export function GeoRankingTable({ data, limit = 10 }: GeoRankingTableProps) {
  const rows = data.slice(0, limit)
  const max = rows[0]?.count ?? 1

  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-600 py-8 text-center">
        Sem dados de localização ainda
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((item) => (
        <div key={`${item.country}-${item.region}-${item.city}`} className="flex items-center gap-3">
          <span className="w-40 shrink-0 text-sm text-neutral-400 truncate">
            {item.city}, {item.region} · {item.country}
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
