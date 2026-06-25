export function TrackCardSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      {/* Capa */}
      <div className="w-12 h-12 shrink-0 rounded-md bg-white/10" />

      {/* Título + artista */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3.5 bg-white/10 rounded w-1/3" />
        <div className="h-3 bg-white/10 rounded w-1/4" />
      </div>

      {/* Tags */}
      <div className="hidden sm:flex gap-1.5">
        <div className="h-4 w-14 bg-white/10 rounded" />
        <div className="h-4 w-12 bg-white/10 rounded" />
      </div>

      {/* Ações */}
      <div className="h-7 w-32 bg-white/10 rounded-md shrink-0" />
    </div>
  )
}

export function TrackGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="max-w-3xl mx-auto w-full divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} />
      ))}
    </div>
  )
}
