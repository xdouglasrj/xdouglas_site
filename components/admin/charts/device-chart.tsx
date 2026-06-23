'use client'

import type { DeviceBreakdown } from '@/lib/analytics/queries'

interface DeviceChartProps {
  data: DeviceBreakdown[]
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
  bot: 'Bot',
  unknown: 'Desconhecido',
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: 'bg-violet-600',
  mobile:  'bg-rose-600',
  tablet:  'bg-amber-600',
  bot:     'bg-neutral-600',
  unknown: 'bg-neutral-700',
}

export function DeviceChart({ data }: DeviceChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-neutral-600 py-8 text-center">
        Sem dados de dispositivos ainda
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => (
        <div key={item.device} className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">
              {DEVICE_LABELS[item.device] ?? item.device}
            </span>
            <span className="text-neutral-500 tabular-nums">
              {item.count.toLocaleString('pt-BR')} · {item.pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${DEVICE_COLORS[item.device] ?? 'bg-neutral-500'}`}
              style={{ width: `${item.pct}%` }}
              role="progressbar"
              aria-valuenow={item.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${DEVICE_LABELS[item.device] ?? item.device}: ${item.pct}%`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
