'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PlaylistSummary {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  trackCount: number
  coverUrls: string[]
}

export function PlaylistList({ initialPlaylists }: { initialPlaylists: PlaylistSummary[] }) {
  const [playlists, setPlaylists] = useState(initialPlaylists)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar playlist')
        return
      }
      setPlaylists((list) => [
        { id: data.playlist.id, name: data.playlist.name, description: null, isPublic: false, trackCount: 0, coverUrls: [] },
        ...list,
      ])
      setName('')
      setCreating(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {creating ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-3 rounded-xl border border-gate-azure bg-white/5 p-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da playlist"
            className="rounded-lg border border-gate-azure bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
          />
          {error && <p className="text-xs text-gate-pink">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-gate-pink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Criando…' : 'Criar playlist'}
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-lg border border-gate-azure px-4 py-2 text-sm text-gate-blue"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg border border-dashed border-gate-azure py-3 text-sm font-medium text-gate-blue transition hover:border-gate-pink hover:text-gate-pink"
        >
          + Criar nova playlist
        </button>
      )}

      {playlists.length === 0 ? (
        <p className="text-sm text-gate-blue">Você ainda não criou nenhuma playlist.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {playlists.map((p) => (
            <li key={p.id}>
              <Link
                href={`/biblioteca/playlists/${p.id}`}
                className="block rounded-xl border border-gate-azure bg-white/[0.02] p-3 transition hover:border-gate-pink"
              >
                <PlaylistCover coverUrls={p.coverUrls} name={p.name} />
                <p className="mt-2 truncate text-sm font-medium text-white">{p.name}</p>
                <p className="text-xs text-gate-blue">
                  {p.trackCount} {p.trackCount === 1 ? 'música' : 'músicas'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PlaylistCover({ coverUrls, name }: { coverUrls: string[]; name: string }) {
  if (coverUrls.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-gate-azure to-gate-bg">
        <span className="text-3xl font-bold text-white/20 select-none">{name.charAt(0).toUpperCase()}</span>
      </div>
    )
  }

  if (coverUrls.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverUrls[0]} alt="" className="aspect-square w-full rounded-lg object-cover" />
    )
  }

  return (
    <div className="grid aspect-square w-full grid-cols-2 gap-0.5 overflow-hidden rounded-lg">
      {Array.from({ length: 4 }).map((_, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={coverUrls[i % coverUrls.length]}
          alt=""
          className="h-full w-full object-cover"
        />
      ))}
    </div>
  )
}
