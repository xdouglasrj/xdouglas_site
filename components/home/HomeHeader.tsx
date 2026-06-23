'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SearchBar } from './SearchBar'
import { LoginModal } from './LoginModal'

const NAV = [
  { label: 'Início', href: '/' },
  { label: 'Músicas', href: '/musicas' },
  { label: 'Artistas', href: '/artistas' },
  { label: 'Comunidade', href: '/comunidade' },
  { label: 'Explorar', href: '/explorar' },
]

export function HomeHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-30 transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/8 bg-[#080808]/90 backdrop-blur-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="relative mx-auto flex h-20 max-w-7xl items-center gap-6 px-4 md:px-8">
          {/* Logo — vídeo, centralizado no topo */}
          <Link
            href="/"
            className="absolute left-1/2 top-2 z-10 -translate-x-1/2 shrink-0"
            aria-label="xDouglas"
          >
            <video
              src="/brand/xdouglas-logo.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="h-14 w-auto object-contain md:h-16"
            />
          </Link>

          {/* Nav — desktop */}
          <nav className="hidden flex-1 items-center justify-center gap-7 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-[#94A3B8] transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search + Login — desktop */}
          <div className="hidden items-center gap-3 md:flex">
            <SearchBar />
            <button
              onClick={() => setLoginOpen(true)}
              className="shrink-0 rounded-lg border border-[#4F8CFF]/40 bg-[#4F8CFF]/10 px-5 py-2 text-sm font-medium text-[#4F8CFF] transition hover:bg-[#4F8CFF]/20"
            >
              Entrar
            </button>
          </div>

          {/* Hamburguer — mobile */}
          <button
            className="ml-auto md:hidden text-[#94A3B8] hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-white/8 bg-[#080808]/95 backdrop-blur-lg md:hidden">
            <div className="px-4 py-4 space-y-1">
              <div className="mb-4">
                <SearchBar />
              </div>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-[#94A3B8] hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3">
                <button
                  onClick={() => { setMenuOpen(false); setLoginOpen(true) }}
                  className="w-full rounded-lg bg-[#4F8CFF] py-3 text-sm font-semibold text-white"
                >
                  Entrar
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
