'use client'

import { useState } from 'react'
import Link from 'next/link'

const TYPES = [
  { value: 'DJ', label: 'DJ', icon: '🎧' },
  { value: 'PRODUTOR', label: 'Produtor', icon: '🎛️' },
  { value: 'ARTISTA', label: 'Artista', icon: '🎤' },
  { value: 'MUSICO', label: 'Músico', icon: '🎸' },
  { value: 'OUVINTE', label: 'Ouvinte', icon: '🎶' },
] as const
type TipoUsuario = typeof TYPES[number]['value']

const inputClass =
  'w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gate-blue'

interface GateInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginClick: () => void
}

export function GateInviteModal({ isOpen, onClose, onLoginClick }: GateInviteModalProps) {
  const [tipo, setTipo] = useState<TipoUsuario | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTipo(null)
    setName('')
    setEmail('')
    setPhone('')
    setMessage('')
    setConsent(false)
    setSubmitted(false)
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tipo) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          phone,
          tipoUsuario: tipo,
          message: message || undefined,
          consent,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError(data.error ?? 'Não foi possível enviar sua solicitação.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 py-10"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-md rounded-2xl border border-gate-azure bg-gate-bg p-8 shadow-2xl shadow-black/80">
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 text-gate-blue transition-colors hover:text-white"
          aria-label="Fechar"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {submitted ? (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gate-pink/15">
                <svg className="h-7 w-7 text-gate-pink" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">Solicitação enviada</h2>
            <p className="text-sm text-gate-blue">
              Você entrou na lista. Assim que seu convite ficar disponível, você receberá um aviso por WhatsApp ou email.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 rounded-lg border border-gate-blue px-6 py-2.5 text-sm font-semibold text-gate-blue transition hover:border-gate-pink hover:text-gate-pink"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <h2 className="mb-1 text-2xl font-bold text-white">Pedir convite</h2>
            <p className="mb-7 text-sm text-gate-blue">
              Faça parte da próxima geração da música independente.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Qual é a sua área de atuação na música? *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTipo(t.value)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                        tipo === t.value
                          ? 'border-gate-pink bg-gate-pink/15 text-gate-pink'
                          : 'border-gate-azure bg-white/5 text-gate-blue hover:border-gate-pink/60 hover:text-white'
                      }`}
                    >
                      <span aria-hidden>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Nome</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required type="text" placeholder="Seu nome" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="seu@email.com" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>WhatsApp</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel" placeholder="(00) 00000-0000" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Mensagem (opcional)</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Conte um pouco sobre você ou por que quer entrar..."
                  className={`${inputClass} resize-none`}
                />
                <p className="mt-1 text-right text-xs text-gate-blue">{message.length}/500</p>
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 accent-gate-pink"
                />
                <span className="text-xs leading-relaxed text-gate-blue">
                  Concordo com a{' '}
                  <Link href="/privacidade" className="text-gate-pink hover:underline">
                    Política de Privacidade
                  </Link>{' '}
                  e autorizo o uso dos meus dados para comunicações da plataforma xDouglas.
                </span>
              </label>

              {error && <p className="text-sm text-gate-pink">{error}</p>}

              <button
                type="submit"
                disabled={loading || !tipo || !consent}
                className="mt-2 w-full rounded-lg bg-gate-pink py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Entrar na lista'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gate-blue">
              Já tem conta?{' '}
              <button onClick={onLoginClick} className="font-medium text-gate-pink hover:underline">
                Entrar
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
