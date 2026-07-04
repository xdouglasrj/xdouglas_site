'use client'

import { useState } from 'react'

// ============================================================
// V3 Plano 12 — mini-modal "Seguir para baixar"
//
// Mostrado quando a faixa está em downloadMode="follow" e o usuário
// logado ainda não segue o artista. Ao seguir (via a API de follow
// existente, que já dispara notificação/pontos), dispara o download
// na hora — sem segundo clique.
// ============================================================

interface FollowToDownloadModalProps {
  /** id do usuário dono da faixa a ser seguido */
  artistUserId: string
  artistName: string
  artistHandle: string | null
  artistPhotoUrl: string | null
  onClose: () => void
  /** Chamado após seguir com sucesso — deve iniciar o download (source follow_gate) */
  onFollowed: () => void
}

export function FollowToDownloadModal({
  artistUserId,
  artistName,
  artistHandle,
  artistPhotoUrl,
  onClose,
  onFollowed,
}: FollowToDownloadModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFollow() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: artistUserId }),
      })
      const data = await res.json().catch(() => null)

      // A API faz toggle: garante que o resultado é "seguindo". Se por acaso
      // já seguia (following=false após toggle desligou), reverte para manter
      // o follow — mas o caso normal é o modal só abrir quando NÃO segue.
      if (res.ok && data?.following) {
        onFollowed()
        return
      }
      if (res.ok && data?.following === false) {
        // Toggle desligou um follow existente — liga de novo e segue em frente
        await fetch('/api/social/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: artistUserId }),
        })
        onFollowed()
        return
      }
      setError(data?.error ?? 'Não foi possível seguir agora. Tente novamente.')
    } catch {
      setError('Erro de conexão. Verifique sua internet.')
    } finally {
      setBusy(false)
    }
  }

  const handleLabel = artistHandle ? `@${artistHandle}` : artistName

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Seguir para baixar"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-gate-azure bg-gate-bg p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Avatar do artista */}
        <div className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full border border-gate-azure bg-white/5">
          {artistPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artistPhotoUrl} alt={artistName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/30">
              {artistName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <p className="text-base font-semibold text-white">
          Siga {handleLabel} para baixar
        </p>
        <p className="mt-1.5 text-sm text-gate-blue">
          Esta faixa é liberada para quem segue o artista. O download começa assim que você seguir.
        </p>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleFollow}
            disabled={busy}
            className="w-full rounded-lg bg-gate-pink py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? 'Seguindo…' : 'Seguir e baixar'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full rounded-lg border border-gate-azure py-2.5 text-sm font-medium text-gate-blue transition hover:text-white disabled:opacity-60"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
