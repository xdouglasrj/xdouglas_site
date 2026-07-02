'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { isPasswordValid, PasswordStrengthMeter } from '@/components/auth/password-strength'

interface SignupFormProps {
  initialInviteCode?: string
}

interface InvitePreview {
  email: string
}

// Mesmas categorias do funil público (GateInviteModal). As artísticas viram
// conta de músico/produtor (role ARTIST); Ouvinte vira conta de ouvinte (GUEST).
const CATEGORIES = [
  { value: 'DJ', label: 'DJ', icon: '🎧' },
  { value: 'PRODUTOR', label: 'Produtor', icon: '🎛️' },
  { value: 'ARTISTA', label: 'Artista', icon: '🎤' },
  { value: 'MUSICO', label: 'Músico', icon: '🎸' },
  { value: 'OUVINTE', label: 'Ouvinte', icon: '🎶' },
] as const
type Categoria = typeof CATEGORIES[number]['value']

const ARTIST_CATEGORIES: readonly string[] = ['DJ', 'PRODUTOR', 'ARTISTA', 'MUSICO']

const inputClass =
  'w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gate-blue'

export function SignupForm({ initialInviteCode = '' }: SignupFormProps) {
  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(true)

  const [categoria, setCategoria] = useState<Categoria | null>(null)
  const [name, setName] = useState('')
  const [artisticName, setArtisticName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)

  const isArtist = categoria !== null && ARTIST_CATEGORIES.includes(categoria)

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
        setInvite({ email: data.email })
      })
      .catch(() => setInviteError('Erro ao carregar o convite. Tente novamente.'))
      .finally(() => setInviteLoading(false))
  }, [initialInviteCode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoria) {
      setError('Escolha sua área de atuação.')
      return
    }
    if (name.trim().length < 2) {
      setError('Informe seu nome.')
      return
    }
    if (isArtist && artisticName.trim().length < 2) {
      setError('Informe seu nome artístico.')
      return
    }
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
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria,
          name: name.trim(),
          ...(isArtist ? { artisticName: artisticName.trim() } : {}),
          username,
          password,
          inviteCode: initialInviteCode,
          newsletterOptIn: false,
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
        <Link href="/inicio" className="mt-6 inline-block text-sm text-gate-pink underline-offset-2 hover:underline">
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
      <h1 className="mb-1 text-2xl font-bold text-white">Criar sua conta</h1>
      <p className="mb-1 text-sm text-gate-blue">
        Bem-vindo(a)! Complete seu acesso para ativar a conta.
      </p>
      <p className="mb-7 text-xs text-gate-blue/70">{invite.email}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Qual é a sua área de atuação na música? *</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategoria(c.value)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  categoria === c.value
                    ? 'border-gate-pink bg-gate-pink/15 text-gate-pink'
                    : 'border-gate-azure bg-white/5 text-gate-blue hover:border-gate-pink/60 hover:text-white'
                }`}
              >
                <span aria-hidden>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Nome *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className={inputClass}
            placeholder="Seu nome"
          />
        </div>

        {isArtist && (
          <div>
            <label className={labelClass}>Nome artístico *</label>
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

        {error && <p className="text-sm text-gate-pink">{error}</p>}

        <button
          type="submit"
          disabled={
            loading ||
            !categoria ||
            name.trim().length < 2 ||
            (isArtist && artisticName.trim().length < 2) ||
            !username.trim() ||
            /\s/.test(username) ||
            !isPasswordValid(password)
          }
          className="mt-2 w-full rounded-lg bg-gate-pink py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Enviando...' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gate-blue">
        Já tem conta?{' '}
        <Link href="/inicio" className="font-medium text-gate-pink hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
