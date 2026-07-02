'use client'

import { useEffect, useRef, useState } from 'react'

// ============================================================
// Botão "Adicionar à playlist" — dropdown com as playlists do
// usuário + opção de criar uma nova inline (sem sair da página).
// Usado na página da música e no player.
// ============================================================

interface PlaylistOption {
  id: string
  name: string
}

interface AddToPlaylistButtonProps {
  trackId: string
  compact?: boolean
}

export function AddToPlaylistButton({ trackId, compact = false }: AddToPlaylistButtonProps) {
  const [open, setOpen] = useState(false)
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function openDropdown() {
    setOpen((v) => !v)
    setFeedback(null)
    if (playlists.length === 0) {
      setLoading(true)
      try {
        const res = await fetch('/api/playlists')
        const data = await res.json()
        if (res.ok) setPlaylists(data.playlists ?? [])
      } finally {
        setLoading(false)
      }
    }
  }

  async function addToPlaylist(playlistId: string) {
    setFeedback(null)
    const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId }),
    })
    const data = await res.json()
    if (res.ok) {
      setFeedback('Adicionada!')
      setTimeout(() => setOpen(false), 800)
    } else {
      setFeedback(data.error === 'Música já está na playlist' ? 'Já está nessa playlist' : 'Erro ao adicionar')
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setPlaylists((list) => [{ id: data.playlist.id, name: data.playlist.name }, ...list])
      await addToPlaylist(data.playlist.id)
      setNewName('')
      setCreating(false)
    } else {
      setFeedback(data.error ?? 'Erro ao criar playlist')
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={openDropdown}
        className={[
          'flex items-center gap-1.5 shrink-0 rounded-md border border-gate-azure text-white/70 transition hover:border-gate-pink hover:text-gate-pink',
          compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-1.5 text-sm',
        ].join(' ')}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <PlaylistIcon />
        Adicionar à playlist
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-64 rounded-lg border border-gate-azure bg-gate-bg p-2 shadow-2xl">
          {loading && <p className="px-2 py-2 text-xs text-gate-blue">Carregando…</p>}

          {!loading && playlists.length === 0 && !creating && (
            <p className="px-2 py-2 text-xs text-gate-blue">Você ainda não tem playlists.</p>
          )}

          {!loading && (
            <ul className="max-h-52 overflow-y-auto">
              {playlists.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => addToPlaylist(p.id)}
                    className="block w-full truncate rounded-md px-2 py-2 text-left text-sm text-white transition hover:bg-gate-pink/15 hover:text-gate-pink"
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {feedback && <p className="px-2 py-1 text-xs text-gate-pink">{feedback}</p>}

          {creating ? (
            <form onSubmit={handleCreate} className="mt-1 flex gap-2 border-t border-gate-azure pt-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome da playlist"
                className="min-w-0 flex-1 rounded-md border border-gate-azure bg-white/5 px-2 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-gate-pink"
              />
              <button type="submit" className="shrink-0 rounded-md bg-gate-pink px-2.5 py-1.5 text-xs font-semibold text-white">
                Criar
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-1 w-full rounded-md border-t border-gate-azure px-2 py-2 text-left text-xs font-medium text-gate-pink"
            >
              + Criar nova playlist
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PlaylistIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h13M3 12h9M3 18h9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14v6M14 17h6" />
    </svg>
  )
}
