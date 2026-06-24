'use client'

import { useEffect, useState } from 'react'

type Tema = 'light' | 'dark'

const STORAGE_KEY = 'xd_tema'

function getSistema(): Tema {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function useTema() {
  const [tema, setTemaState] = useState<Tema>('dark')

  useEffect(() => {
    const atual = document.documentElement.getAttribute('data-theme') as Tema | null
    setTemaState(atual || getSistema())

    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const proximo = e.matches ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', proximo)
        setTemaState(proximo)
      }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  function alternar() {
    const proximo: Tema = tema === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', proximo)
    localStorage.setItem(STORAGE_KEY, proximo)
    setTemaState(proximo)
  }

  return { tema, alternar }
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { tema, alternar } = useTema()

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Alternar tema claro e escuro"
      className={`relative inline-flex h-8 w-[60px] shrink-0 items-center rounded-full border border-gate-azure bg-white/5 transition-colors ${className}`}
    >
      <span
        className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-brand-accent shadow-[0_0_10px_rgba(255,138,76,0.5)] transition-transform"
        style={{ transform: tema === 'light' ? 'translateX(28px)' : 'translateX(3px)' }}
      >
        {tema === 'dark' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-white"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
          </svg>
        )}
      </span>
    </button>
  )
}
