export function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-sm font-medium text-neutral-300 mb-5">{title}</h2>
      {children}
    </div>
  )
}
