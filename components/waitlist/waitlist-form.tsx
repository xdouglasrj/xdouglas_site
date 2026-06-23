'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

// ============================================================
// Tipos
// ============================================================

type TipoUsuario = 'DJ' | 'PRODUTOR' | 'ARTISTA' | 'OUTRO'

const TIPOS: { value: TipoUsuario; label: string; description: string }[] = [
  { value: 'DJ',       label: 'DJ',       description: 'Mixo e toco nas pistas' },
  { value: 'PRODUTOR', label: 'Produtor', description: 'Crio e produzo faixas' },
  { value: 'ARTISTA',  label: 'Artista',  description: 'Canto, componho, performo' },
  { value: 'OUTRO',    label: 'Outro',    description: 'Outra relação com a música' },
]

// ============================================================
// Componente
// ============================================================

export function WaitlistForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState<TipoUsuario | null>(null)
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)

  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setErrorMsg(null)

    // Validações client-side
    const errors: Record<string, string> = {}
    if (!email) errors.email = 'Email obrigatório'
    if (!tipo) errors.tipoUsuario = 'Selecione seu perfil'
    if (!consent) errors.consent = 'Você deve aceitar a política de privacidade'
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }

    setState('loading')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          tipoUsuario: tipo,
          message: message.trim() || undefined,
          consent: true,
          consentedAt: new Date().toISOString(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.issues) {
          const fe: Record<string, string> = {}
          for (const [k, msgs] of Object.entries(data.issues)) {
            fe[k] = (msgs as string[])[0]
          }
          setFieldErrors(fe)
          setState('idle')
          return
        }

        if (res.status === 409) {
          // Email já cadastrado — mostra sucesso mesmo assim (não revela o dado)
          setState('success')
          return
        }

        setErrorMsg(data.error ?? 'Erro ao enviar. Tente novamente.')
        setState('error')
        return
      }

      setState('success')
    } catch {
      setErrorMsg('Erro de conexão. Verifique sua internet.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-8">
        <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center">
          <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Você está na lista!</h2>
          <p className="mt-1 text-sm text-neutral-400 max-w-xs">
            Quando abrirmos as portas, você será um dos primeiros a saber.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {errorMsg && <Alert variant="error" message={errorMsg} />}

      <Input
        label="Nome"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Seu nome (opcional)"
        autoComplete="name"
      />

      <Input
        label="Email *"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        autoComplete="email"
        error={fieldErrors.email}
        required
      />

      {/* Seletor de tipo de usuário */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">
          Seu perfil *
        </span>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(t.value)}
              className={[
                'flex flex-col items-start gap-0.5 px-3 py-3 rounded-lg border text-left transition-colors',
                tipo === t.value
                  ? 'border-rose-600 bg-rose-950/30 text-white'
                  : 'border-neutral-700 bg-neutral-800/40 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300',
              ].join(' ')}
              aria-pressed={tipo === t.value}
            >
              <span className="text-sm font-medium">{t.label}</span>
              <span className="text-[11px] opacity-70">{t.description}</span>
            </button>
          ))}
        </div>
        {fieldErrors.tipoUsuario && (
          <p className="text-xs text-red-400" role="alert">{fieldErrors.tipoUsuario}</p>
        )}
      </div>

      {/* Mensagem opcional */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-300">
          Mensagem <span className="text-neutral-600 font-normal">(opcional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Conta um pouco sobre você e o que espera da plataforma…"
          className="w-full rounded-md px-3 py-2 text-sm bg-neutral-900 text-white border border-neutral-700 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none placeholder:text-neutral-600"
        />
        <p className="text-xs text-neutral-700 text-right">
          {message.length}/500
        </p>
      </div>

      {/* Consentimento LGPD */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-900 accent-rose-600 shrink-0"
        />
        <span className="text-xs text-neutral-500 leading-relaxed">
          Li e aceito a{' '}
          <a href="/privacidade" target="_blank" className="text-rose-500 hover:text-rose-400 underline">
            Política de Privacidade
          </a>
          . Meus dados serão usados apenas para contato sobre o lançamento da plataforma.
        </span>
      </label>
      {fieldErrors.consent && (
        <p className="text-xs text-red-400 -mt-3" role="alert">{fieldErrors.consent}</p>
      )}

      <Button
        type="submit"
        fullWidth
        loading={state === 'loading'}
        className="mt-1"
      >
        Entrar na lista de espera
      </Button>
    </form>
  )
}
