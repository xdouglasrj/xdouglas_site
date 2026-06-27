export function TrackCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gate-azure bg-white/5 p-4 animate-pulse">
      {/* Título + artista */}
      <div className="space-y-1.5">
        <div className="h-3.5 bg-white/10 rounded w-1/3" />
        <div className="h-3 bg-white/10 rounded w-1/4" />
      </div>

      {/* Player (capa + waveform) */}
      <div className="mt-3 flex items-center gap-3">
        <div className="w-14 h-14 shrink-0 rounded-xl bg-white/10" />
        <div className="flex-1 h-8 bg-white/10 rounded" />
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gate-azure/40">
        <div className="h-4 w-20 bg-white/10 rounded" />
        <div className="h-7 w-24 bg-white/10 rounded-md" />
      </div>
    </div>
  )
}

export function TrackGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} />
      ))}
    </div>
  )
}
