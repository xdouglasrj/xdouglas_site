'use client'

import { useState } from 'react'

interface GateSignupModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginClick: () => void
  onInviteClick: () => void
}

type Step = 'choice' | 'artist' | 'visitor' | 'done'

const inputClass =
  'w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gate-blue'

export function GateSignupModal({ isOpen, onClose, onLoginClick, onInviteClick }: GateSignupModalProps) {
  const [step, setStep] = useState<Step>('choice')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneMessage, setDoneMessage] = useState('')

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [phone, setPhone] = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState<boolean | null>(null)

  function reset() {
    setStep('choice')
    setError(null)
    setDoneMessage('')
    setName('')
    setUsername('')
    setEmail('')
    setPassword('')
    setInviteCode('')
    setPhone('')
    setNewsletterOptIn(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  if (!isOpen) return null

  async function handleSubmit(type: 'artist' | 'visitor', e: React.FormEvent) {
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
        setDoneMessage(data.message)
        setStep('done')
      } else {
        setError(data.error ?? 'Não foi possível concluir o cadastro.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="absolute inset-0 bg-gate-bg/80 backdrop-blur-sm" />

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

        {step === 'choice' && (
          <>
            <h2 className="mb-1 text-2xl font-bold text-white">Cadastrar</h2>
            <p className="mb-7 text-sm text-gate-blue">
              A xDouglas é uma comunidade por convite. Peça o seu e enviaremos o link de cadastro por email.
            </p>

            <button
              onClick={onInviteClick}
              className="block w-full rounded-lg bg-gate-pink py-3.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
            >
              Pedir Convite
            </button>

            <p className="mt-6 text-center text-sm text-gate-blue">
              Já tem conta?{' '}
              <button onClick={onLoginClick} className="font-medium text-gate-pink hover:underline">
                Entrar
              </button>
            </p>
          </>
        )}

        {step === 'artist' && (
          <>
            <h2 className="mb-1 text-2xl font-bold text-white">Cadastro de músico/produtor</h2>
            <p className="mb-7 text-sm text-gate-blue">
              Informe o código de convite que você recebeu por email.
            </p>

            <form onSubmit={(e) => handleSubmit('artist', e)} className="space-y-4">
              <div>
                <label className={labelClass}>Nome</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Seu nome" />
              </div>
              <div>
                <label className={labelClass}>Nome artístico</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} required className={inputClass} placeholder="Seu nome artístico" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="seu@email.com" />
              </div>
              <div>
                <label className={labelClass}>WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="(00) 00000-0000"
                />
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
                <p className="mt-1.5 text-xs text-gate-blue">
                  Não tem convite?{' '}
                  <button type="button" onClick={onInviteClick} className="text-gate-pink hover:underline">
                    Pedir Convite
                  </button>
                </p>
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
                {loading ? 'Enviando...' : 'Enviar cadastro'}
              </button>
            </form>

            <button onClick={() => setStep('choice')} className="mt-4 w-full text-center text-sm text-gate-blue hover:text-white">
              ← Voltar
            </button>
          </>
        )}

        {step === 'visitor' && (
          <>
            <h2 className="mb-1 text-2xl font-bold text-white">Cadastro de visitante</h2>
            <p className="mb-7 text-sm text-gate-blue">
              Informe o código de convite que você recebeu por WhatsApp ou email.
            </p>

            <form onSubmit={(e) => handleSubmit('visitor', e)} className="space-y-4">
              <div>
                <label className={labelClass}>Nome</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Seu nome" />
              </div>
              <div>
                <label className={labelClass}>Usuário</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} required className={inputClass} placeholder="seu_usuario" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="seu@email.com" />
              </div>
              <div>
                <label className={labelClass}>WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="(00) 00000-0000"
                />
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
                <p className="mt-1.5 text-xs text-gate-blue">
                  Não tem convite?{' '}
                  <button type="button" onClick={onInviteClick} className="text-gate-pink hover:underline">
                    Pedir Convite
                  </button>
                </p>
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
                {loading ? 'Enviando...' : 'Criar conta de visitante'}
              </button>
            </form>

            <button onClick={() => setStep('choice')} className="mt-4 w-full text-center text-sm text-gate-blue hover:text-white">
              ← Voltar
            </button>
          </>
        )}

        {step === 'done' && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gate-pink/15">
                <svg className="h-7 w-7 text-gate-pink" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">Cadastro enviado</h2>
            <p className="text-sm text-gate-blue">{doneMessage}</p>
            <button
              onClick={handleClose}
              className="mt-6 rounded-lg border border-gate-blue px-6 py-2.5 text-sm font-semibold text-gate-blue transition hover:border-gate-pink hover:text-gate-pink"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
