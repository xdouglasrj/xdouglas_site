'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

// ============================================================
// Tipos
// ============================================================

type TipoUsuario = 'DJ' | 'PRODUTOR' | 'ARTISTA' | 'OUTRO'

type FormState = 'idle' | 'loading' | 'success' | 'error' | 'duplicate'

const TIPO_OPTIONS: { value: TipoUsuario; label: string; emoji: string }[] = [
  { value: 'DJ',      label: 'DJ',       emoji: '🎧' },
  { value: 'PRODUTOR',label: 'Produtor', emoji: '🎛️' },
  { value: 'ARTISTA', label: 'Artista',  emoji: '🎤' },
  { value: 'OUTRO',   label: 'Outro',    emoji: '👤' },
]

// ============================================================
// Componente
// ============================================================

export function WaitlistForm() {
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [tipo, setTipo] = useState<TipoUsuario | ''>('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setErrorMsg('')

    if (!tipo) {
      setFieldErrors({ tipoUsuario: 'Selecione seu perfil' })
      return
    }

    setFormState('loading')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          tipoUsuario: tipo,
          message: message || undefined,
          consent: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setFormState('duplicate')
          return
        }
        if (data.issues) {
          const fields: Record<string, string> = {}
          for (const [k, v] of Object.entries(data.issues)) {
            fields[k] = (v as string[])[0]
          }
          setFieldErrors(fields)
          setFormState('idle')
          return
        }
        setErrorMsg(data.error ?? 'Erro ao enviar. Tente novamente.')
        setFormState('error')
        return
      }

      setFormState('success')
    } catch {
      setErrorMsg('Erro de conexão. Verifique sua internet.')
      setFormState('error')
    }
  }

  // ── Sucesso ───────────────────────────────────────────────

  if (formState === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-white">Você está na lista!</p>
          <p className="mt-1 text-sm text-neutral-400">
            Avisaremos em <strong className="text-neutral-300">{email}</strong> quando o acesso abrir.
          </p>
        </div>
      </div>
    )
  }

  // ── Email duplicado ───────────────────────────────────────

  if (formState === 'duplicate') {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <p className="text-sm text-neutral-400">
          <strong className="text-white">{email}</strong> já está na nossa lista.
        </p>
        <p className="text-xs text-neutral-600">
          Você receberá o convite quando abrirmos o acesso.
        </p>
      </div>
    )
  }

  // ── Formulário ────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formState === 'error' && errorMsg && (
        <Alert variant="error" message={errorMsg} />
      )}

      {/* Seleção de perfil */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-300">
          Qual é o seu perfil? *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIPO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTipo(opt.value)}
              className={[
                'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left',
                tipo === opt.value
                  ? 'border-rose-600 bg-rose-950/40 text-white'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300',
              ].join(' ')}
              aria-pressed={tipo === opt.value}
            >
              <span aria-hidden="true">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
        {fieldErrors.tipoUsuario && (
          <p className="text-xs text-red-400">{fieldErrors.tipoUsuario}</p>
        )}
      </div>

      <Input
        type="email"
        label="Email *"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        autoComplete="email"
        required
      />

      <Input
        label="Nome (opcional)"
        placeholder="Como prefere ser chamado"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-300">
          Mensagem (opcional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Conte um pouco sobre você ou por que quer entrar…"
          className="w-full rounded-md px-3 py-2 text-sm bg-neutral-900 text-white border border-neutral-700 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none placeholder:text-neutral-500"
        />
        <p className="text-xs text-neutral-700 text-right">{message.length}/500</p>
      </div>

      {/* Consentimento LGPD */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-rose-600 shrink-0"
          required
        />
        <span className="text-xs text-neutral-500 leading-relaxed">
          Concordo com a{' '}
          <a href="/privacidade" target="_blank" className="text-neutral-400 underline hover:text-white transition-colors">
            Política de Privacidade
          </a>{' '}
          e autorizo o uso do meu email para comunicações da plataforma xDouglas.
        </span>
      </label>

      <Button
        type="submit"
        fullWidth
        loading={formState === 'loading'}
        disabled={!consent || !email || !tipo}
      >
        {formState === 'loading' ? 'Enviando…' : 'Entrar na lista'}
      </Button>
    </form>
  )
}
