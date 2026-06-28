'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { broadcastLogout, onLogoutBroadcast } from '@/lib/auth/cross-tab-logout'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { TRACK_GENRES } from '@/lib/tracks/genres'

const GENRES = TRACK_GENRES

type Panel = 'music' | 'search' | null

interface IconSidebarProps {
  isAdmin?: boolean
  isArtist?: boolean
  mappingEnabled?: boolean
  photoUrl?: string | null
  handle?: string | null
}

export function IconSidebar({ isAdmin = false, isArtist = false, mappingEnabled = false, photoUrl = null, handle = null }: IconSidebarProps) {
  const profileHref = handle ? `/perfil/${handle}` : '/perfil'
  const [panel, setPanel] = useState<Panel>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
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
    // Busca unificada: músicas do catálogo completo + pessoas pelo @handle
    router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
    setPanel(null)
    setMobileOpen(false)
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
    <>
      {/* ============================================================ */}
      {/* MOBILE — topbar + menu em tela cheia (md:hidden)            */}
      {/* ============================================================ */}
      <div className="md:hidden">
        <header className="sticky top-0 z-50 grid h-14 grid-cols-[2.5rem_1fr_auto] items-center border-b border-gate-azure bg-gate-bg px-4">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gate-blue hover:text-gate-pink"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <Image
            src="/brand/xdouglas-logo.png"
            alt="xDouglas"
            width={1200}
            height={675}
            priority
            className="h-8 w-auto justify-self-center object-contain"
          />
          <ThemeToggle />
        </header>

        {mobileOpen && (
          <div className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto bg-gate-bg px-4 py-5">
            {/* Busca */}
            <form onSubmit={handleSearchSubmit} className="mb-5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Música, artista ou @usuário..."
                  className="w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
                />
                <button type="submit" className="shrink-0 rounded-lg bg-gate-pink px-4 text-sm font-semibold text-white">
                  Ir
                </button>
              </div>
            </form>

            {/* Navegação principal */}
            <nav className="flex flex-col gap-1">
              <MobileLink href="/inicio" onClick={() => setMobileOpen(false)} label="Início" />
              <MobileLink href="/musicas-recentes" onClick={() => setMobileOpen(false)} label="Músicas recentes" />
              <MobileLink href="/comentarios" onClick={() => setMobileOpen(false)} label="Comentários" />
              <MobileLink href="/forum" onClick={() => setMobileOpen(false)} label="Fórum" />
              <MobileLink href="/suporte" onClick={() => setMobileOpen(false)} label="Suporte" />

              {(isArtist || isAdmin) && (
                <MobileLink href="/upload" onClick={() => setMobileOpen(false)} label="Upload de música" />
              )}

              {mappingEnabled && (
                <MobileLink href="/minhas-musicas" onClick={() => setMobileOpen(false)} label="Minhas músicas" />
              )}

              <MobileLink href={profileHref} onClick={() => setMobileOpen(false)} label="Meu perfil" />

              {isAdmin && (
                <MobileLink href="/admin/dashboard" onClick={() => setMobileOpen(false)} label="Painel admin" />
              )}
            </nav>

            {/* Gêneros */}
            <p className="mt-6 mb-2 px-1 text-xs font-bold uppercase tracking-widest text-gate-blue">Gêneros</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/generos"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-gate-pink px-3 py-1.5 text-sm font-medium text-gate-pink transition hover:bg-gate-pink/15"
              >
                Todos
              </Link>
              {GENRES.map((g) => (
                <Link
                  key={g}
                  href={`/generos?genre=${encodeURIComponent(g)}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full border border-gate-azure px-3 py-1.5 text-sm text-gate-blue transition hover:border-gate-pink hover:text-gate-pink"
                >
                  {g}
                </Link>
              ))}
            </div>

            {/* Sair */}
            <button
              onClick={handleLogout}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-red-900/60 bg-red-950/30 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-900/40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H9" />
              </svg>
              Sair
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* DESKTOP — faixa fixa com a logo, só na área de conteúdo      */}
      {/* (o trilho de ícones tem prioridade e fica no topo, sem vão)  */}
      {/* ============================================================ */}
      <header className="fixed left-16 right-0 top-0 z-30 hidden h-20 items-center justify-center bg-gradient-to-b from-gate-bg via-gate-bg to-transparent md:flex">
        <Image
          src="/brand/xdouglas-logo.png"
          alt="xDouglas"
          width={1200}
          height={675}
          priority
          className="h-12 w-auto object-contain"
        />
      </header>

      {/* ============================================================ */}
      {/* DESKTOP — trilho de ícones fixo, do topo ao fim da tela      */}
      {/* ============================================================ */}
      <div ref={wrapperRef} className="fixed left-0 top-0 z-40 hidden h-screen md:flex">
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

          {mappingEnabled && (
            <Link
              href="/minhas-musicas"
              className="flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
              aria-label="Minhas músicas"
              title="Minhas músicas"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16l4-6 4 3 4-7" />
              </svg>
            </Link>
          )}

          <Link
            href="/comentarios"
            className="flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
            aria-label="Comentários"
            title="Comentários"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
              <path strokeLinecap="round" d="M7.5 9h9M7.5 12.5h6" />
            </svg>
          </Link>

          <Link
            href="/forum"
            className="flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
            aria-label="Fórum"
            title="Fórum"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </Link>

          <Link
            href="/suporte"
            className="flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
            aria-label="Suporte"
            title="Suporte"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.4v.6" />
              <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
            </svg>
          </Link>

          <Link
            href={profileHref}
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

          <div className="mt-auto flex flex-col items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
              aria-label="Sair"
              title="Sair"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H9" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Painel — gêneros */}
        {panel === 'music' && (
          <div className="h-screen w-64 max-w-[calc(100vw-4rem)] border-r border-gate-azure bg-gate-bg px-6 py-6 shadow-2xl overflow-y-auto">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gate-blue">
              Gêneros
            </h2>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/musicas-recentes"
                  onClick={() => setPanel(null)}
                  className="block rounded-md px-2 py-2 text-sm font-semibold text-gate-pink transition hover:bg-gate-pink/15"
                >
                  Músicas recentes
                </Link>
              </li>
              <li>
                <Link
                  href="/generos"
                  onClick={() => setPanel(null)}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-white transition hover:bg-gate-pink/15 hover:text-gate-pink"
                >
                  Todos os gêneros
                </Link>
              </li>
              {GENRES.map((g) => (
                <li key={g}>
                  <Link
                    href={`/generos?genre=${encodeURIComponent(g)}`}
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
                placeholder="Música, artista ou @usuário..."
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
    </>
  )
}

function MobileLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-lg px-3 py-3 text-base font-medium text-white transition hover:bg-gate-pink/15 hover:text-gate-pink"
    >
      {label}
    </Link>
  )
}
