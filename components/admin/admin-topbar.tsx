'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { broadcastLogout, onLogoutBroadcast } from '@/lib/auth/cross-tab-logout'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { getVisibleGroups } from '@/components/admin/admin-sidebar'

export function AdminTopbar({
  role = 'ADMIN',
  permissions = [],
}: {
  role?: string
  permissions?: string[]
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navItems = getVisibleGroups(role, permissions).flatMap((group) => group.items)

  // Se outra aba fizer logout, esta aba acompanha imediatamente
  useEffect(() => onLogoutBroadcast(() => { window.location.href = '/' }), [])

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    broadcastLogout()
    window.location.href = '/'
  }

  return (
    <header className="md:hidden sticky top-0 z-40 border-b border-gate-azure bg-gate-bg">
      <div className="h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-gate-blue hover:text-white"
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <ThemeToggle />
      </div>

      {/* Dropdown mobile */}
      {open && (
        <nav className="border-t border-gate-azure bg-gate-bg p-2 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={clsx(
                'px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === item.href
                  ? 'bg-gate-pink/15 text-gate-pink font-medium'
                  : 'text-gate-blue hover:text-white hover:bg-gate-pink/10'
              )}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-lg text-sm text-gate-blue hover:text-gate-pink hover:bg-gate-pink/10 text-left transition-colors"
          >
            Sair
          </button>
        </nav>
      )}
    </header>
  )
}
