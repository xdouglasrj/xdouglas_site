'use client'

import { usePlayer, type PlayerTrack } from '@/components/player/player-provider'

// ============================================================
// "Tocar tudo" da série (V3 Plano 14) — enfileira os episódios no player
// global e começa pelo primeiro (topo da lista = mais recente).
// ============================================================

export function SeriesPlayAllButton({ queue }: { queue: PlayerTrack[] }) {
  const { playTrack } = usePlayer()

  if (queue.length === 0) return null

  return (
    <button
      type="button"
      onClick={() => playTrack(queue[0], queue)}
      className="inline-flex items-center gap-2 rounded-lg bg-gate-pink px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
    >
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M4 2.5v11a1 1 0 0 0 1.53.848l8-5.5a1 1 0 0 0 0-1.696l-8-5.5A1 1 0 0 0 4 2.5z" />
      </svg>
      Tocar tudo
    </button>
  )
}
