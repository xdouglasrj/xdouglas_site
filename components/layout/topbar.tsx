'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TopbarProps {
  isLoggedIn: boolean
  photoUrl?: string | null
  handle?: string | null
}

// Topbar estilo "YouTube" (§3.2 do MAPA-E-PLANO-XDOUGLAS.md): logo à
// esquerda (link para /inicio quando logado), busca minimalista
// centralizada, notificação + avatar à direita. Renderizada dentro do
// IconSidebar para aparecer em toda página que já usa <IconSidebar />,
// sem precisar tocar em cada layout individualmente.
export function Topbar({ isLoggedIn, photoUrl = null, handle = null }: TopbarProps) {
  const [focused, setFocused] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const profileHref = handle ? `/perfil/${handle}` : '/perfil'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
    setFocused(false)
  }

  return (
    <header className="fixed left-16 right-0 top-0 z-30 hidden h-20 items-center gap-4 border-b border-gate-azure bg-gate-bg px-6 md:flex">
      <Link href={isLoggedIn ? '/inicio' : '/'} className="shrink-0" aria-label="xDouglas — início">
        <Image
          src="/brand/xdouglas-logo.png"
          alt="xDouglas"
          width={1200}
          height={675}
          priority
          className="h-10 w-auto object-contain"
        />
      </Link>

      <form
        onSubmit={handleSubmit}
        className={`mx-auto flex items-center transition-all ${focused ? 'w-full max-w-xl' : 'w-full max-w-sm'}`}
      >
        <div className="flex w-full items-center gap-2 rounded-full border border-gate-azure bg-white/5 px-4 py-2.5 transition focus-within:border-gate-pink focus-within:ring-1 focus-within:ring-gate-pink/40">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gate-blue">
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Música, artista ou @usuário..."
            className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
          />
        </div>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        {isLoggedIn && (
          <Link
            href="/notificacoes"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
            aria-label="Notificações"
            title="Notificações"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </Link>
        )}

        {isLoggedIn ? (
          <Link
            href={profileHref}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
            aria-label="Meu perfil"
            title="Meu perfil"
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Perfil" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
              </svg>
            )}
          </Link>
        ) : (
          <Link
            href="/?login=1"
            className="rounded-md bg-gate-pink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  )
}
