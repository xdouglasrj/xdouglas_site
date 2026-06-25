'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { broadcastLogout, onLogoutBroadcast } from '@/lib/auth/cross-tab-logout'
import { ThemeToggle } from '@/components/ui/theme-toggle'

// ============================================================
// Itens de navegação
// ============================================================

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Músicas',
    href: '/admin/musicas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 13V4l8-2v9" />
        <circle cx="4" cy="13" r="2" />
        <circle cx="12" cy="11" r="2" />
      </svg>
    ),
  },
] as const

const PEOPLE_ITEMS = [
  { label: 'Pedidos recebidos', href: '/admin/convites' },
  { label: 'Convites pendentes', href: '/admin/convites-aceitos' },
  { label: 'Cadastro ativo', href: '/admin/cadastros' },
] as const

// ============================================================
// Sidebar — mesmo padrão de trilho de ícones usado em /inicio
// ============================================================

export function AdminSidebar() {
  const pathname = usePathname()
  const [peopleOpen, setPeopleOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPeopleOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Se outra aba fizer logout (admin ou não), esta aba acompanha imediatamente
  useEffect(() => onLogoutBroadcast(() => { window.location.href = '/' }), [])

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    broadcastLogout()
    window.location.href = '/'
  }

  const peopleActive = pathname.startsWith('/admin/convites') || pathname.startsWith('/admin/cadastros')

  return (
    <div ref={wrapperRef} className="fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] md:flex">
      <nav
        className="flex h-full w-16 flex-col items-center gap-2 border-r border-gate-azure bg-gate-bg py-4"
        aria-label="Navegação admin"
      >
        <Link
          href="/admin/dashboard"
          className="mb-2 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white transition hover:bg-gate-pink/15"
          title="xDouglas Admin"
        >
          x<span className="text-gate-pink">D</span>
        </Link>

        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-gate-pink/15',
                active ? 'bg-gate-pink/15 text-gate-pink' : 'text-gate-blue hover:text-gate-pink'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              title={item.label}
            >
              {item.icon}
            </Link>
          )
        })}

        {/* Convites pendentes e cadastros */}
        <button
          onClick={() => setPeopleOpen((v) => !v)}
          className={clsx(
            'flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-gate-pink/15',
            peopleActive || peopleOpen ? 'bg-gate-pink/15 text-gate-pink' : 'text-gate-blue hover:text-gate-pink'
          )}
          aria-label="Convites e cadastros"
          aria-expanded={peopleOpen}
          title="Convites e cadastros"
        >
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="8" cy="5" r="3" />
            <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" />
          </svg>
        </button>

        <Link
          href="/inicio"
          className="flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
          aria-label="Ver site"
          title="Ver site"
        >
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3M9 1h6m0 0v6m0-6L7 9" />
          </svg>
        </Link>

        <div className="mt-auto flex flex-col items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
            aria-label="Sair"
            title="Sair"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Painel — convites e cadastros */}
      {peopleOpen && (
        <div className="h-full w-60 border-r border-gate-azure bg-gate-bg px-4 py-6 shadow-2xl">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gate-blue">
            Pessoas
          </h2>
          <ul className="space-y-1">
            {PEOPLE_ITEMS.map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setPeopleOpen(false)}
                    className={clsx(
                      'block rounded-md px-3 py-2 text-sm font-medium transition',
                      active
                        ? 'bg-gate-pink/15 text-gate-pink'
                        : 'text-white hover:bg-gate-pink/15 hover:text-gate-pink'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
