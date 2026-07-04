'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePlayer, type PlayerTrack } from '@/components/player/player-provider'

interface PlaylistTrack {
  id: string
  slug: string
  title: string
  coverUrl: string | null
  artistName: string
}

export function PlaylistTrackList({
  playlistId,
  initialTracks,
}: {
  playlistId: string
  initialTracks: PlaylistTrack[]
}) {
  const [tracks, setTracks] = useState(initialTracks)
  const player = usePlayer()

  // Índice tocando agora — derivado do player global (V3 Plano 1)
  const playingIndex =
    player.currentTrack && player.isPlaying
      ? tracks.findIndex((t) => t.id === player.currentTrack?.id)
      : -1

  function toPlayerQueue(list: PlaylistTrack[]): PlayerTrack[] {
    return list.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artistName,
      coverUrl: t.coverUrl,
    }))
  }

  function persistOrder(next: PlaylistTrack[]) {
    setTracks(next)
    fetch(`/api/playlists/${playlistId}/tracks/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tracks: next.map((t, i) => ({ trackId: t.id, position: i })),
      }),
    }).catch(() => {})
  }

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...tracks]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    persistOrder(next)
  }

  function moveDown(index: number) {
    if (index === tracks.length - 1) return
    const next = [...tracks]
    ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
    persistOrder(next)
  }

  async function removeTrack(trackId: string) {
    setTracks((list) => list.filter((t) => t.id !== trackId))
    await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' })
  }

  // Toca pelo player global — a playlist inteira vira a fila
  function playFrom(index: number) {
    const track = tracks[index]
    if (!track) return
    player.playTrack(toPlayerQueue(tracks)[index], toPlayerQueue(tracks))
  }

  if (tracks.length === 0) {
    return <p className="text-sm text-gate-blue">Essa playlist ainda não tem músicas.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => (playingIndex === -1 ? playFrom(0) : player.toggle())}
        className="self-start rounded-lg bg-gate-pink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {playingIndex === -1 ? '▶ Tocar tudo' : '⏸ Pausar'}
      </button>

      <ul className="rounded-xl border border-gate-azure bg-white/5 divide-y divide-gate-azure overflow-hidden">
        {tracks.map((t, i) => (
          <li key={t.id} className={`flex items-center gap-3 px-4 py-3 ${playingIndex === i ? 'bg-gate-pink/10' : ''}`}>
            <button
              onClick={() => playFrom(i)}
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10"
              aria-label={`Tocar ${t.title}`}
            >
              {t.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-white/40">{t.title.charAt(0).toUpperCase()}</span>
              )}
            </button>

            <Link href={`/musicas/${t.slug}`} className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{t.title}</p>
              <p className="truncate text-xs text-gate-blue">{t.artistName}</p>
            </Link>

            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="flex h-7 w-7 items-center justify-center rounded text-gate-blue transition hover:text-gate-pink disabled:opacity-30"
                aria-label="Mover para cima"
              >
                ↑
              </button>
              <button
                onClick={() => moveDown(i)}
                disabled={i === tracks.length - 1}
                className="flex h-7 w-7 items-center justify-center rounded text-gate-blue transition hover:text-gate-pink disabled:opacity-30"
                aria-label="Mover para baixo"
              >
                ↓
              </button>
              <button
                onClick={() => removeTrack(t.id)}
                className="flex h-7 w-7 items-center justify-center rounded text-gate-blue transition hover:text-red-400"
                aria-label="Remover da playlist"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
