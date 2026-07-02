'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { broadcastLogout, onLogoutBroadcast } from '@/lib/auth/cross-tab-logout'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { hasPermission, type PermissionId } from '@/lib/permissions/catalog'

// ============================================================
// Itens de navegação agrupados por tema (§3.5 do plano)
// `permission: null` = exclusivo de ADMIN (grupo/trancado)
// ============================================================

interface NavItem {
  label: string
  href: string
  permission: PermissionId | null
}

export interface NavGroup {
  key: string
  title: string
  emoji: string
  icon: React.ReactNode
  items: NavItem[]
}

export function getVisibleGroups(role: string, permissions: string[]): NavGroup[] {
  const user = { role, permissions }
  return GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.permission === null
        ? role === 'ADMIN'
        : hasPermission(user, item.permission)),
    }))
    .filter((group) => group.items.length > 0)
}

export const GROUPS: NavGroup[] = [
  {
    key: 'overview',
    title: 'Visão geral',
    emoji: '📊',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', permission: null },
      { label: 'Plays (detalhado)', href: '/admin/plays', permission: null },
    ],
  },
  {
    key: 'musica',
    title: 'Conteúdo musical',
    emoji: '🎵',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 13V4l8-2v9" />
        <circle cx="4" cy="13" r="2" />
        <circle cx="12" cy="11" r="2" />
      </svg>
    ),
    items: [
      { label: 'Músicas', href: '/admin/musicas', permission: 'musicas.moderar' },
      { label: 'Nova música', href: '/admin/musicas/nova', permission: 'musicas.editar' },
      { label: 'Pedidos do dia', href: '/admin/musicas/hoje', permission: 'musicas.moderar' },
      { label: 'Agendamentos', href: '/admin/agendamentos', permission: 'musicas.editar' },
      { label: 'Gêneros', href: '/admin/generos', permission: null },
    ],
  },
  {
    key: 'pessoas',
    title: 'Pessoas',
    emoji: '👥',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="8" cy="5" r="3" />
        <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" />
      </svg>
    ),
    items: [
      { label: 'Cadastros ativos', href: '/admin/cadastros', permission: 'usuarios.visualizar' },
      { label: 'Usuários', href: '/admin/usuarios', permission: 'usuarios.visualizar' },
      { label: 'Convites recebidos', href: '/admin/convites', permission: 'convites.gerenciar' },
      { label: 'Convites aprovados', href: '/admin/convites-aceitos', permission: 'convites.gerenciar' },
    ],
  },
  {
    key: 'moderacao',
    title: 'Comunidade & moderação',
    emoji: '🛡️',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 1.5 1.5 14h13L8 1.5z" />
        <path d="M8 6v3.5" />
        <circle cx="8" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    ),
    items: [
      { label: 'Denúncias', href: '/admin/denuncias', permission: 'denuncias.gerenciar' },
      { label: 'Suporte', href: '/admin/suporte', permission: 'suporte.responder' },
      { label: 'Moderadores', href: '/admin/moderadores', permission: null },
      { label: 'Setores do fórum', href: '/admin/forum/setores', permission: 'forum.moderar' },
    ],
  },
  {
    key: 'gamificacao',
    title: 'Gamificação',
    emoji: '🪙',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 5.5h12l-1 8.5H3l-1-8.5z" />
        <path d="M5 5.5V4a3 3 0 0 1 6 0v1.5" />
      </svg>
    ),
    items: [
      { label: 'Loja de pontos', href: '/admin/loja', permission: null },
      { label: 'Promoções de XP', href: '/admin/loja/promocoes', permission: null },
    ],
  },
  {
    key: 'config',
    title: 'Configurações do site',
    emoji: '⚙️',
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="8" cy="8" r="2.2" />
        <path d="M8 1.5v1.4M8 13.1v1.4M2.6 4.3l1.2.7M12.2 11l1.2.7M2.6 11.7l1.2-.7M12.2 5l1.2-.7M1.5 8h1.4M13.1 8h1.4" />
      </svg>
    ),
    items: [
      { label: 'Funcionalidades', href: '/admin/configuracoes/funcionalidades', permission: null },
      { label: 'Upload & conteúdo', href: '/admin/configuracoes/upload', permission: null },
      { label: 'Convites automáticos', href: '/admin/configuracoes/convites', permission: null },
      { label: 'Anúncios', href: '/admin/configuracoes/ads', permission: null },
      { label: 'Permissões de moderador', href: '/admin/configuracoes/permissoes', permission: null },
    ],
  },
]

// ============================================================
// Sidebar — trilho de ícones com painel expansível por grupo
// ============================================================

export function AdminSidebar({
  role = 'ADMIN',
  permissions = [],
}: {
  role?: string
  permissions?: string[]
}) {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const visibleGroups = getVisibleGroups(role, permissions)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
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

  const activeGroup = visibleGroups.find((group) => openGroup === group.key)

  return (
    <div ref={wrapperRef} className="fixed left-0 top-0 z-40 hidden h-screen md:flex">
      <nav
        className="flex h-screen w-16 flex-col items-center gap-2 border-r border-gate-azure bg-gate-bg py-4"
        aria-label="Navegação admin"
      >
        <Link
          href="/admin/dashboard"
          className="mb-2 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white transition hover:bg-gate-pink/15"
          title="xDouglas Admin"
        >
          x<span className="text-gate-pink">D</span>
        </Link>

        {visibleGroups.map((group) => {
          const active = group.items.some((item) => pathname.startsWith(item.href))
          return (
            <button
              key={group.key}
              onClick={() => setOpenGroup((v) => (v === group.key ? null : group.key))}
              className={clsx(
                'flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-gate-pink/15',
                active || openGroup === group.key ? 'bg-gate-pink/15 text-gate-pink' : 'text-gate-blue hover:text-gate-pink'
              )}
              aria-label={group.title}
              aria-expanded={openGroup === group.key}
              title={group.title}
            >
              {group.icon}
            </button>
          )
        })}

        <Link
          href="/inicio"
          className="mt-2 flex h-11 w-11 items-center justify-center rounded-full text-gate-blue transition hover:bg-gate-pink/15 hover:text-gate-pink"
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

      {/* Painel — sub-itens do grupo aberto */}
      {activeGroup && (
        <div className="h-screen w-60 border-r border-gate-azure bg-gate-bg px-4 py-6 shadow-2xl">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gate-blue">
            {activeGroup.emoji} {activeGroup.title}
          </h2>
          <ul className="space-y-1">
            {activeGroup.items.map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpenGroup(null)}
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
