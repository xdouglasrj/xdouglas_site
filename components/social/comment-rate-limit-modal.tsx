'use client'

function formatRetryAt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

interface CommentRateLimitModalProps {
  retryAt: string
  onClose: () => void
}

export function CommentRateLimitModal({ retryAt, onClose }: CommentRateLimitModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm rounded-2xl border border-gate-azure bg-gate-bg p-6 text-center shadow-2xl shadow-black/80">
        <h2 className="mb-2 text-lg font-bold text-white">Você já comentou recentemente</h2>
        <p className="text-sm text-gate-blue">
          Cada pessoa pode enviar um comentário a cada 48 horas. Você poderá comentar novamente em{' '}
          <span className="font-semibold text-white">{formatRetryAt(retryAt)}</span>.
        </p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-gate-pink py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}
