'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { broadcastLogin } from '@/lib/auth/cross-tab-logout'

interface GateLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSignupClick: () => void
}

const REMEMBER_USERNAME_KEY = 'xd_remember_username'

export function GateLoginModal({ isOpen, onClose, onSignupClick }: GateLoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberUsername, setRememberUsername] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_USERNAME_KEY)
    if (saved) {
      setUsername(saved)
      setRememberUsername(true)
    }
  }, [])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        const data = await res.json()
        if (rememberUsername) {
          localStorage.setItem(REMEMBER_USERNAME_KEY, username)
        } else {
          localStorage.removeItem(REMEMBER_USERNAME_KEY)
        }
        broadcastLogin()
        if (data.user?.role === 'ADMIN') {
          window.location.href = '/admin/dashboard'
        } else {
          const params = new URLSearchParams({
            welcomeName: data.user?.username ?? data.user?.name ?? '',
            firstToday: data.user?.isFirstLoginToday ? '1' : '0',
          })
          window.location.href = `/inicio?${params.toString()}`
        }
      } else {
        setError('Usuário ou senha inválidos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-md rounded-2xl border border-gate-azure bg-gate-bg p-8 shadow-2xl shadow-black/80">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gate-blue transition-colors hover:text-white"
          aria-label="Fechar"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-1 text-2xl font-bold text-white">Entrar</h2>
        <p className="mb-7 text-sm text-gate-blue">Acesso exclusivo para membros da comunidade.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gate-blue">
              Usuário ou e-mail
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seu_usuario ou e-mail"
              required
              autoComplete="username"
              className="w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gate-blue">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gate-blue transition-colors hover:text-white"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 4.5 9.5 7-.36 1.13-1.07 2.41-2.06 3.59M6.61 6.61C4.6 8 3.36 9.94 2.5 12c.85 2.05 2.1 3.99 4.11 5.39A9.77 9.77 0 0012 19" />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S5.5 5 12 5s9.5 7 9.5 7-3 7-9.5 7-9.5-7-9.5-7z" />
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
            <Link
              href="/esqueci-senha"
              className="mt-1.5 inline-block text-xs text-gate-blue transition hover:text-gate-pink"
            >
              Esqueci minha senha
            </Link>
          </div>

          <label className="flex items-center gap-2 text-xs text-gate-blue">
            <input
              type="checkbox"
              checked={rememberUsername}
              onChange={(e) => setRememberUsername(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gate-azure bg-white/5 accent-gate-pink"
            />
            Salvar meu usuário neste dispositivo
          </label>

          {error && <p className="text-sm text-gate-pink">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-gate-pink py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gate-azure" />
          <span className="text-xs text-gate-blue">ou</span>
          <div className="h-px flex-1 bg-gate-azure" />
        </div>

        <button
          type="button"
          onClick={onSignupClick}
          className="w-full rounded-lg border border-gate-blue py-3 text-sm font-semibold text-gate-blue transition hover:border-gate-pink hover:text-gate-pink"
        >
          Cadastrar
        </button>
      </div>
    </div>
  )
}
