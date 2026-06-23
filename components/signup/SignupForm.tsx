'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SignupFormProps {
  type: 'artist' | 'visitor'
  initialInviteCode?: string
}

const inputClass =
  'w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gate-blue'

export function SignupForm({ type, initialInviteCode = '' }: SignupFormProps) {
  const isArtist = type === 'artist'

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [inviteCode, setInviteCode] = useState(initialInviteCode)
  const [newsletterOptIn, setNewsletterOptIn] = useState<boolean | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newsletterOptIn === null) {
      setError('Selecione se deseja receber notícias.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name,
          username,
          email,
          password,
          phone,
          inviteCode,
          newsletterOptIn,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setDoneMessage(data.message ?? 'Cadastro recebido.')
      } else {
        setError(data.error ?? 'Não foi possível concluir o cadastro.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (doneMessage) {
    return (
      <div className="rounded-2xl border border-gate-pink/30 bg-gate-pink/5 p-10 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gate-pink/15">
            <svg className="h-7 w-7 text-gate-pink" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-white">Conta criada</h2>
        <p className="text-sm text-gate-blue">{doneMessage}</p>
        <Link href="/" className="mt-6 inline-block text-sm text-gate-pink underline-offset-2 hover:underline">
          Ir para o início
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gate-azure bg-gate-bg p-6 sm:p-8">
      <h1 className="mb-1 text-2xl font-bold text-white">
        {isArtist ? 'Cadastro de músico/produtor' : 'Cadastro de ouvinte'}
      </h1>
      <p className="mb-7 text-sm text-gate-blue">
        Complete seus dados para ativar o acesso enviado no seu convite.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Seu nome" />
        </div>

        <div>
          <label className={labelClass}>{isArtist ? 'Nome artístico' : 'Usuário'}</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className={inputClass}
            placeholder={isArtist ? 'Seu nome artístico' : 'seu_usuario'}
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="seu@email.com" />
        </div>

        <div>
          <label className={labelClass}>WhatsApp</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputClass} placeholder="(00) 00000-0000" />
        </div>

        <div>
          <label className={labelClass}>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} placeholder="Mínimo 8 caracteres" />
        </div>

        <div>
          <label className={labelClass}>Código de convite</label>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
            className="w-full rounded-lg border border-gate-pink/50 bg-gate-pink/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
            placeholder="XXXX-XXXX-XXXX"
          />
        </div>

        <div>
          <label className={labelClass}>Deseja receber notícias de atualizações do site no seu WhatsApp?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setNewsletterOptIn(true)}
              className={`rounded-lg border py-2.5 text-sm font-semibold transition ${
                newsletterOptIn === true
                  ? 'border-gate-pink bg-gate-pink/15 text-gate-pink'
                  : 'border-gate-azure text-gate-blue hover:border-gate-pink hover:text-gate-pink'
              }`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => setNewsletterOptIn(false)}
              className={`rounded-lg border py-2.5 text-sm font-semibold transition ${
                newsletterOptIn === false
                  ? 'border-gate-pink bg-gate-pink/15 text-gate-pink'
                  : 'border-gate-azure text-gate-blue hover:border-gate-pink hover:text-gate-pink'
              }`}
            >
              Não
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-gate-pink">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-lg bg-gate-pink py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Enviando...' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gate-blue">
        Já tem conta?{' '}
        <Link href="/" className="font-medium text-gate-pink hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
