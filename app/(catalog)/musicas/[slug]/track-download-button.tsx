'use client'

import { useState } from 'react'
import { useAnalytics } from '@/components/analytics/use-analytics'
import type { TrackPublic } from '@/lib/tracks/types'

// ============================================================
// Estados do botão de download
// ============================================================

type DownloadState = 'idle' | 'loading' | 'ready' | 'error' | 'rate_limited'

interface DownloadButtonState {
  state: DownloadState
  errorMessage?: string
  retryAfter?: Date
}

interface TrackDownloadButtonProps {
  track: TrackPublic
}

export function TrackDownloadButton({ track }: TrackDownloadButtonProps) {
  const { trackMusicView } = useAnalytics()
  const [status, setStatus] = useState<DownloadButtonState>({ state: 'idle' })

  async function handleDownload() {
    if (status.state === 'loading') return

    trackMusicView(track.id)
    setStatus({ state: 'loading' })

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = data.retryAfter
            ? new Date(data.retryAfter)
            : undefined
          setStatus({ state: 'rate_limited', retryAfter })
          setTimeout(() => setStatus({ state: 'idle' }), 10_000)
          return
        }

        setStatus({
          state: 'error',
          errorMessage: data.error ?? 'Erro ao preparar download.',
        })
        setTimeout(() => setStatus({ state: 'idle' }), 5_000)
        return
      }

      // Sucesso: redireciona para a URL assinada R2
      // O browser inicia o download diretamente do CDN
      setStatus({ state: 'ready' })
      window.location.href = data.downloadUrl

      // Volta ao idle após alguns segundos (o browser já baixou)
      setTimeout(() => setStatus({ state: 'idle' }), 5_000)
    } catch {
      setStatus({
        state: 'error',
        errorMessage: 'Erro de conexão. Verifique sua internet.',
      })
      setTimeout(() => setStatus({ state: 'idle' }), 5_000)
    }
  }

  const isClickable = status.state === 'idle' || status.state === 'error'

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={isClickable ? handleDownload : undefined}
        disabled={status.state === 'loading' || status.state === 'rate_limited'}
        className={[
          'w-full sm:w-auto flex items-center justify-center gap-2',
          'px-6 py-3 rounded-lg font-medium text-white text-sm',
          'transition-colors disabled:pointer-events-none disabled:opacity-60',
          buttonStyle(status.state),
        ].join(' ')}
        aria-label={`Download de ${track.title}`}
      >
        <ButtonIcon state={status.state} />
        {buttonLabel(status.state)}
      </button>

      {/* Mensagem de erro inline */}
      {status.state === 'error' && status.errorMessage && (
        <p className="text-xs text-red-400">{status.errorMessage}</p>
      )}

      {/* Rate limit */}
      {status.state === 'rate_limited' && (
        <p className="text-xs text-amber-400">
          Muitos downloads. Tente novamente em instantes.
        </p>
      )}
    </div>
  )
}

// ── Helpers de UI ─────────────────────────────────────────────

function buttonStyle(state: DownloadState): string {
  switch (state) {
    case 'idle':         return 'bg-gate-pink hover:opacity-90'
    case 'loading':      return 'bg-gate-pink cursor-wait'
    case 'ready':        return 'bg-emerald-700'
    case 'error':        return 'bg-red-700 hover:bg-red-600'
    case 'rate_limited': return 'bg-amber-700'
  }
}

function buttonLabel(state: DownloadState): string {
  switch (state) {
    case 'idle':         return 'Baixar faixa'
    case 'loading':      return 'Preparando…'
    case 'ready':        return 'Download iniciado!'
    case 'error':        return 'Tentar novamente'
    case 'rate_limited': return 'Aguarde…'
  }
}

function ButtonIcon({ state }: { state: DownloadState }) {
  if (state === 'loading') return <LoadingSpinner />
  if (state === 'ready')   return <CheckIcon />
  return <DownloadIcon />
}

// ── Ícones ────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v8M5 7l3 3 3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8l4 4 6-7" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg className="w-4 h-4 shrink-0 animate-spin" viewBox="0 0 24 24"
      fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
