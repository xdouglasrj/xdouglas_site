'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'

interface PersonItem {
  id: string
  handle: string
  displayName: string
  photoUrl: string | null
}

interface FollowListModalProps {
  userId: string
  type: 'followers' | 'following'
  count: number
  label: string
}

export function FollowListModal({ userId, type, count, label }: FollowListModalProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<PersonItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchList = useCallback(
    async (q: string) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ userId, type })
        if (q.trim()) params.set('q', q.trim())
        const res = await fetch(`/api/social/follow/list?${params}`)
        if (res.ok) {
          const data = await res.json()
          setPeople(data.users)
        }
      } finally {
        setLoading(false)
      }
    },
    [userId, type]
  )

  // Carrega ao abrir
  useEffect(() => {
    if (open) fetchList('')
  }, [open, fetchList])

  // Busca com debounce enquanto o popup está aberto
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => fetchList(query), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function close() {
    setOpen(false)
    setQuery('')
    setPeople([])
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-white/80 transition hover:text-gate-pink"
      >
        <strong className="text-white">{count}</strong> {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div className="relative flex max-h-[80vh] w-full max-w-sm flex-col rounded-2xl border border-gate-azure bg-gate-bg p-6 shadow-2xl shadow-black/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gate-blue">{label}</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar"
                className="text-white/50 transition hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou @usuário..."
              className="mt-4 w-full rounded-md border border-gate-azure bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
            />

            <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
              {loading ? (
                <p className="px-1 py-2 text-sm text-white/40">Carregando...</p>
              ) : people.length === 0 ? (
                <p className="px-1 py-2 text-sm text-white/40">
                  {query.trim() ? 'Nenhum resultado.' : 'Ninguém por aqui ainda.'}
                </p>
              ) : (
                people.map((p) => (
                  <Link
                    key={p.id}
                    href={`/perfil/${p.handle}`}
                    onClick={close}
                    className="flex items-center gap-3 rounded-lg px-1 py-2 transition hover:bg-white/5"
                  >
                    <Avatar photoUrl={p.photoUrl} alt={p.displayName} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{p.displayName}</p>
                      <p className="truncate text-xs text-gate-blue">@{p.handle}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
