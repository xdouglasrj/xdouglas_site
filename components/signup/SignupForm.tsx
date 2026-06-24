'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SignupFormProps {
  type: 'artist' | 'visitor'
  initialInviteCode?: string
}

interface InvitePreview {
  name: string | null
  email: string
  phone: string | null
}

const inputClass =
  'w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gate-blue'

function getPasswordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    uppercase: (pw.match(/[A-Z]/g) ?? []).length >= 2,
    special: (pw.match(/[^A-Za-z0-9]/g) ?? []).length >= 2,
  }
}

function isPasswordValid(pw: string) {
  const checks = getPasswordChecks(pw)
  return checks.length && checks.uppercase && checks.special
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const checks = getPasswordChecks(password)
  const score = Number(checks.length) + Number(checks.uppercase) + Number(checks.special)

  const levels = [
    { label: 'Muito fraca', color: 'bg-red-500' },
    { label: 'Fraca', color: 'bg-orange-500' },
    { label: 'Média', color: 'bg-yellow-400' },
    { label: 'Forte', color: 'bg-green-500' },
  ]
  const level = password.length === 0 ? null : levels[score]

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              level && score > i ? level.color : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      {level && (
        <p className="mt-1 text-xs text-gate-blue">
          Força: <span className="font-semibold">{level.label}</span>
        </p>
      )}
      <ul className="mt-1.5 space-y-0.5 text-xs">
        <li className={checks.length ? 'text-green-400' : 'text-gate-blue/60'}>
          {checks.length ? '✓' : '•'} Mínimo 8 caracteres
        </li>
        <li className={checks.uppercase ? 'text-green-400' : 'text-gate-blue/60'}>
          {checks.uppercase ? '✓' : '•'} Pelo menos 2 letras maiúsculas
        </li>
        <li className={checks.special ? 'text-green-400' : 'text-gate-blue/60'}>
          {checks.special ? '✓' : '•'} Pelo menos 2 caracteres especiais (ex: !@#$%)
        </li>
      </ul>
    </div>
  )
}

export function SignupForm({ type, initialInviteCode = '' }: SignupFormProps) {
  const isArtist = type === 'artist'

  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(true)

  const [username, setUsername] = useState('')
  const [artisticName, setArtisticName] = useState('')
  const [password, setPassword] = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState<boolean | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!initialInviteCode) {
      setInviteError('Link de convite inválido. Verifique o link recebido por email.')
      setInviteLoading(false)
      return
    }
    fetch(`/api/invites/${encodeURIComponent(initialInviteCode)}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setInviteError(data.error ?? 'Convite inválido ou expirado.')
          return
        }
        setInvite({ name: data.name, email: data.email, phone: data.phone })
      })
      .catch(() => setInviteError('Erro ao carregar o convite. Tente novamente.'))
      .finally(() => setInviteLoading(false))
  }, [initialInviteCode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) {
      setError('Informe seu login.')
      return
    }
    if (/\s/.test(username)) {
      setError('O login não pode conter espaços.')
      return
    }
    if (!isPasswordValid(password)) {
      setError('A senha precisa ter no mínimo 8 caracteres, 2 letras maiúsculas e 2 caracteres especiais.')
      return
    }
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
          username,
          password,
          ...(isArtist ? { artisticName } : {}),
          inviteCode: initialInviteCode,
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

  if (inviteLoading) {
    return (
      <div className="rounded-2xl border border-gate-azure bg-gate-bg p-6 sm:p-8 text-center">
        <p className="text-sm text-gate-blue">Carregando seu convite...</p>
      </div>
    )
  }

  if (inviteError || !invite) {
    return (
      <div className="rounded-2xl border border-gate-azure bg-gate-bg p-6 sm:p-8 text-center">
        <h1 className="mb-2 text-xl font-bold text-white">Não foi possível continuar</h1>
        <p className="text-sm text-gate-pink">{inviteError ?? 'Convite inválido.'}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gate-azure bg-gate-bg p-6 sm:p-8">
      <h1 className="mb-1 text-2xl font-bold text-white">
        {isArtist ? 'Cadastro de músico/produtor' : 'Cadastro de ouvinte'}
      </h1>
      <p className="mb-1 text-sm text-gate-blue">
        Bem-vindo(a), {invite.name ?? invite.email}! Complete seu acesso para ativar a conta.
      </p>
      <p className="mb-7 text-xs text-gate-blue/70">
        {invite.email}{invite.phone ? ` · ${invite.phone}` : ''}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Login *</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
            required
            pattern="^\S+$"
            title="O login não pode conter espaços"
            className={inputClass}
            placeholder="seu_usuario"
          />
          <p className="mt-1 text-xs text-gate-blue/70">Sem espaços. Obrigatório.</p>
        </div>

        {isArtist && (
          <div>
            <label className={labelClass}>Nome artístico</label>
            <input
              value={artisticName}
              onChange={(e) => setArtisticName(e.target.value)}
              required
              className={inputClass}
              placeholder="Como você é conhecido"
            />
          </div>
        )}

        <div>
          <label className={labelClass}>Senha *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
            placeholder="Mínimo 8 caracteres, 2 maiúsculas e 2 especiais"
          />
          <PasswordStrengthMeter password={password} />
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
          disabled={loading || !username.trim() || /\s/.test(username) || !isPasswordValid(password)}
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
