'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CadastroPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [lgpd, setLgpd] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-24">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="mb-12 block text-center">
          <span className="font-['Space_Grotesk'] text-2xl font-light text-white">x</span>
          <span className="font-['Space_Grotesk'] text-2xl font-semibold text-[#4F8CFF]">Douglas</span>
        </Link>

        {submitted ? (
          <div className="rounded-2xl border border-[#4F8CFF]/20 bg-[#4F8CFF]/5 p-10 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4F8CFF]/20">
                <svg className="h-7 w-7 text-[#4F8CFF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>
            <h2 className="mb-2 font-['Manrope'] text-2xl font-bold text-white">Conta criada</h2>
            <p className="text-[#94A3B8]">Bem-vindo à comunidade. Seu perfil está sendo preparado.</p>
            <Link href="/" className="mt-6 inline-block text-sm text-[#4F8CFF] underline-offset-2 hover:underline">
              Ir para o início
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#0B0B0F] p-8">
            <h1 className="mb-2 font-['Manrope'] text-2xl font-bold text-white">Criar conta</h1>
            <p className="mb-8 text-sm text-[#94A3B8]">
              Use seu código de convite para entrar na comunidade.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">Nome</label>
                <input
                  required
                  type="text"
                  placeholder="Seu nome"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#4F8CFF]/60 focus:ring-1 focus:ring-[#4F8CFF]/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">Email</label>
                <input
                  required
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#4F8CFF]/60 focus:ring-1 focus:ring-[#4F8CFF]/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">Senha</label>
                <input
                  required
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#4F8CFF]/60 focus:ring-1 focus:ring-[#4F8CFF]/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                  Código de convite
                </label>
                <input
                  required
                  type="text"
                  placeholder="XXXX-XXXX-XXXX"
                  className="w-full rounded-lg border border-[#67E8F9]/20 bg-[#67E8F9]/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#67E8F9]/50 focus:ring-1 focus:ring-[#67E8F9]/20"
                />
                <p className="mt-1.5 text-xs text-[#94A3B8]">
                  Não tem convite?{' '}
                  <Link href="/convite" className="text-[#67E8F9] hover:underline">Solicitar acesso</Link>
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={lgpd}
                  onChange={(e) => setLgpd(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#4F8CFF]"
                />
                <span className="text-xs text-[#94A3B8] leading-relaxed">
                  Li e aceito a{' '}
                  <Link href="/privacidade" className="text-[#4F8CFF] hover:underline">Política de Privacidade</Link>
                  {' '}e o tratamento dos meus dados conforme a LGPD.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !lgpd}
                className="w-full rounded-lg bg-[#4F8CFF] py-3.5 text-sm font-semibold text-white transition hover:bg-[#4F8CFF]/90 disabled:opacity-50"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
