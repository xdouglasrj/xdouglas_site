'use client'

import { useState } from 'react'
import Link from 'next/link'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        window.location.href = '/admin/dashboard'
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0B0F] p-8 shadow-2xl shadow-black/60">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[#94A3B8] transition-colors hover:text-white"
          aria-label="Fechar"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo mini */}
        <div className="mb-6 flex items-center gap-2">
          <span className="font-['Space_Grotesk'] text-xl font-light tracking-tight text-white">x</span>
          <span className="font-['Space_Grotesk'] text-xl font-semibold tracking-tight text-[#4F8CFF]">Douglas</span>
        </div>

        <h2 className="mb-1 font-['Manrope'] text-2xl font-bold text-white">Entrar no xDouglas</h2>
        <p className="mb-7 text-sm text-[#94A3B8]">Acesso exclusivo para membros da comunidade.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#4F8CFF]/60 focus:ring-1 focus:ring-[#4F8CFF]/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#4F8CFF]/60 focus:ring-1 focus:ring-[#4F8CFF]/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-[#4F8CFF] py-3.5 text-sm font-semibold text-white transition hover:bg-[#4F8CFF]/90 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Divisor */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-[#94A3B8]">ou</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-3 text-center text-sm">
          <p className="text-[#94A3B8]">
            Possui convite?{' '}
            <Link
              href="/cadastro"
              onClick={onClose}
              className="font-medium text-[#4F8CFF] underline-offset-2 hover:underline"
            >
              Criar conta
            </Link>
          </p>
          <p className="text-[#94A3B8]">
            Não possui convite?{' '}
            <Link
              href="/convite"
              onClick={onClose}
              className="font-medium text-[#67E8F9] underline-offset-2 hover:underline"
            >
              Solicitar acesso
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
