export function MetricCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: number
  sub: string
  highlight?: boolean
}) {
  return (
    <div className={[
      'rounded-xl border p-5',
      highlight
        ? 'border-rose-800/60 bg-rose-950/20'
        : 'border-neutral-800 bg-neutral-900',
    ].join(' ')}>
      <p className="text-xs text-neutral-500 uppercase tracking-wide truncate">
        {label}
      </p>
      <p className={[
        'text-2xl font-bold mt-2 tabular-nums',
        highlight ? 'text-rose-400' : 'text-white',
      ].join(' ')}>
        {value.toLocaleString('pt-BR')}
      </p>
      <p className="text-xs text-neutral-600 mt-0.5">{sub}</p>
    </div>
  )
}
