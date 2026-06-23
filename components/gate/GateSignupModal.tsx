'use client'

interface GateSignupModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginClick: () => void
  onInviteClick: () => void
}

export function GateSignupModal({ isOpen, onClose, onLoginClick, onInviteClick }: GateSignupModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-gate-bg/80 backdrop-blur-sm" />

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
      </div>
    </div>
  )
}
