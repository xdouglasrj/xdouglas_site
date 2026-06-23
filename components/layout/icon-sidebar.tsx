'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { broadcastLogout, onLogoutBroadcast } from '@/lib/auth/cross-tab-logout'

const GENRES = ['Funk', 'Rap/Trap', 'Eletrônico', 'Pagode', 'Sertanejo', 'Remix']

type Panel = 'music' | 'search' | null

interface IconSidebarProps {
  isAdmin?: boolean
  isArtist?: boolean
  photoUrl?: string | null
}

export function IconSidebar({ isAdmin = false, isArtist = false, photoUrl = null }: IconSidebarProps) {
  const [panel, setPanel] = useState<Panel>(null)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPanel(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Se outra aba fizer logout, esta aba acompanha imediatamente
  useEffect(() => onLogoutBroadcast(() => { window.location.href = '/' }), [])

  function togglePanel(p: Panel) {
    setPanel((current) => (current === p ? null : p))
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/musicas?q=${encodeURIComponent(query.trim())}`)
    setPanel(null)
  }

  async function handleLogout() {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
    } finally {
      broadcastLogout()
      window.location.href = '/'
    }
  }

  return (
    <div ref={wrapperRef} className="fixed left-0 top-0 z-40 flex h-screen">
      {/* Trilho de ícones */}
      <nav className="flex w-16 flex-col items-center gap-2 border-r border-gate-azure bg-gate-bg py-4">
        <Link
          href="/inicio"
          className="flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
          aria-label="Início"
          title="Início"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
          </svg>
        </Link>

        <button
          onClick={() => togglePanel('music')}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-gate-pink/15 ${
            panel === 'music' ? 'bg-gate-pink/15 text-gate-pink' : 'text-gate-blue hover:text-gate-pink'
          }`}
          aria-label="Gêneros de música"
          title="Gêneros de música"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l11-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="17" cy="16" r="3" />
          </svg>
        </button>

        <button
          onClick={() => togglePanel('search')}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-gate-pink/15 ${
            panel === 'search' ? 'bg-gate-pink/15 text-gate-pink' : 'text-gate-blue hover:text-gate-pink'
          }`}
          aria-label="Buscar"
          title="Buscar"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
          </svg>
        </button>

        {(isArtist || isAdmin) && (
          <Link
            href="/upload"
            className="flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
            aria-label="Upload de música"
            title="Upload de música"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v12M8 8l4-4 4 4" />
            </svg>
          </Link>
        )}

        <Link
          href="/perfil"
          className="flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink overflow-hidden"
          aria-label="Perfil"
          title="Perfil"
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Perfil" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
            </svg>
          )}
        </Link>

        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className="flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
            aria-label="Painel admin"
            title="Painel admin"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="mt-auto flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
          aria-label="Sair"
          title="Sair"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H9" />
          </svg>
        </button>
      </nav>

      {/* Painel — gêneros */}
      {panel === 'music' && (
        <div className="h-screen w-64 max-w-[calc(100vw-4rem)] border-r border-gate-azure bg-gate-bg px-6 py-6 shadow-2xl overflow-y-auto">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gate-blue">
            Gêneros
          </h2>
          <ul className="space-y-1">
            {GENRES.map((g) => (
              <li key={g}>
                <Link
                  href={`/musicas?genre=${encodeURIComponent(g)}`}
                  onClick={() => setPanel(null)}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-white transition hover:bg-gate-pink/15 hover:text-gate-pink"
                >
                  {g}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Painel — busca */}
      {panel === 'search' && (
        <div className="h-screen w-72 max-w-[calc(100vw-4rem)] border-r border-gate-azure bg-gate-bg px-6 py-6 shadow-2xl overflow-y-auto">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gate-blue">
            Buscar
          </h2>
          <form onSubmit={handleSearchSubmit}>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Artista ou música..."
              className="w-full rounded-md border border-gate-azure bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
            />
            <button
              type="submit"
              className="mt-3 w-full rounded-md bg-gate-pink py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Buscar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
