'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/components/analytics/use-analytics'
import { WaveformPlayer } from './waveform-player'
import { TrackLikeButton } from './track-like-button'
import { TrackRepostButton } from './track-repost-button'
import { TrackProgressBar } from './track-progress-bar'
import { FollowToDownloadModal } from './follow-to-download-modal'
import { useAuthPopup } from '@/components/auth/AuthPopupProvider'
import type { TrackPublic } from '@/lib/tracks/types'
import type { PlayerTrack } from '@/components/player/player-provider'
import { trackKindLabel } from '@/lib/tracks/track-kinds'

/** Converte o shape público da API para o shape mínimo do player global */
// Re-exportado do módulo puro para compat de imports existentes.
// Server Components devem importar direto de '@/lib/tracks/to-player-track'
// (uma função re-exportada por um módulo "use client" vira referência de
// cliente e não pode ser chamada no servidor).
export { toPlayerTrack } from '@/lib/tracks/to-player-track'

// ============================================================
// Helpers
// ============================================================

function formatBytes(bytes: string | null): string | null {
  if (!bytes) return null
  const n = Number(bytes)
  if (isNaN(n) || n === 0) return null
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ============================================================
// Componente — card no formato "post de áudio" (capa + waveform)
// ============================================================

interface TrackCardProps {
  track: TrackPublic
  canDownload?: boolean
  /** Lista de origem — tocar esta faixa enfileira a lista a partir dela */
  queue?: PlayerTrack[]
  /**
   * Usuário tem sessão (inclui GUEST). Controla se a barrinha "já ouvido"
   * busca progresso na API (logado) ou no localStorage (anônimo).
   * Default false = anônimo, para não chamar a API em páginas públicas.
   */
  isLoggedIn?: boolean
  /**
   * V3 Plano 13 — faixa com destaque PAGO ativo (pontos). Mostra o selo
   * "Em destaque", visualmente distinto do selo "Fixada" (destaque
   * editorial do admin, âmbar). Não substitui `track.pinned`.
   */
  isHighlighted?: boolean
}

export function TrackCard({ track, canDownload = true, queue, isLoggedIn = false, isHighlighted = false }: TrackCardProps) {
  const router = useRouter()
  const { trackMusicView } = useAnalytics()
  const { openLogin } = useAuthPopup()
  const [downloading, setDownloading] = useState(false)
  const [showFollowModal, setShowFollowModal] = useState(false)

  // V3 Plano 12 — no card não temos o estado de "seguindo" pré-carregado.
  // Tentamos o download direto; se o servidor exigir follow (403
  // FOLLOW_REQUIRED), abrimos o mini-modal. Quem já segue baixa na hora.
  async function requestDownload(source: 'direct' | 'follow_gate') {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: track.id, source }),
    })
    const data = await res.json().catch(() => null)

    if (res.ok && data?.downloadUrl) {
      window.location.href = data.downloadUrl
      return
    }
    if (res.status === 401) {
      openLogin()
      return
    }
    if (res.status === 403 && data?.code === 'FOLLOW_REQUIRED' && track.artist.userId) {
      setShowFollowModal(true)
      return
    }
    // Demais erros permanecem silenciosos no card — a página de detalhe
    // dá feedback mais rico.
  }

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault()
    if (downloading) return

    trackMusicView(track.id)
    setDownloading(true)

    try {
      await requestDownload('direct')
    } catch {
      // Silencioso na linha
    } finally {
      setTimeout(() => setDownloading(false), 3_000)
    }
  }

  function handleFollowed() {
    setShowFollowModal(false)
    router.refresh()
    requestDownload('follow_gate').catch(() => {})
  }

  const fileSize = formatBytes(track.audioSizeBytes)
  const approvedAt = formatDate(track.publishedAt)
  // V3 Plano 12 — rótulo do botão: faixa com follow-gate mostra "Seguir".
  // No card não sabemos se o viewer já segue; quem já segue baixa direto
  // ao clicar (o servidor libera) — o modal só abre em 403 FOLLOW_REQUIRED.
  const gateLabel = track.downloadMode === 'follow' && track.artist.userId ? 'Seguir' : 'Download'

  return (
    <article className="rounded-2xl border border-gate-azure bg-white/5 p-4 transition-colors hover:bg-white/[0.07]">
      {/* Nome da música + dj/produtor */}
      <Link
        href={`/musicas/${track.slug}`}
        onClick={() => trackMusicView(track.id)}
        className="group block"
      >
        <h2 className="font-semibold text-white text-sm truncate group-hover:text-gate-pink transition-colors flex items-center gap-1.5">
          {track.pinned && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 shrink-0">
              <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M5.5 1.5l5.5 5.5-1 1-1.2-.2L6 10.5 3 13.5l3-3-2.3-2.8-.2-1.2 1-1z" />
              </svg>
              Fixada
            </span>
          )}
          {isHighlighted && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded bg-gate-pink/15 text-gate-pink border border-gate-pink/40 shrink-0">
              ⭐ Em destaque
            </span>
          )}
          <span className="truncate">{track.title}</span>
          {track.kind !== 'track' && (
            <span className="inline-flex items-center shrink-0 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded bg-white/5 text-gate-blue border border-gate-azure">
              {trackKindLabel(track.kind)}
            </span>
          )}
        </h2>
        <p className="mt-0.5 text-xs text-gate-blue truncate">
          {track.artist.name}
          {track.producerName && track.producerName !== track.artist.name && (
            <span className="text-white/40"> · prod. {track.producerName}</span>
          )}
        </p>
      </Link>

      {/* Player */}
      <div className="mt-3">
        <WaveformPlayer
          trackId={track.id}
          slug={track.slug}
          title={track.title}
          artistName={track.artist.name}
          coverUrl={track.coverUrl}
          queue={queue}
        />
        {/* Barrinha "já ouvido" (V3 Plano 11) — só aparece se houver progresso salvo */}
        <div className="mt-1.5">
          <TrackProgressBar trackId={track.id} durationSeconds={track.durationSeconds} isLoggedIn={isLoggedIn} />
        </div>
      </div>

      {/* Tags de metadados */}
      <div className="hidden sm:flex flex-wrap items-center gap-1.5 mt-3">
        {track.genre && <MetaTag>{track.genre}</MetaTag>}
        {track.bpm && <MetaTag>{track.bpm} BPM</MetaTag>}
        {track.key && <MetaTag>{track.key}</MetaTag>}
        {fileSize && <MetaTag>{fileSize}</MetaTag>}
        <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded bg-white/5 text-gate-blue border border-gate-azure">
          {track.audioFormat}
        </span>
        {approvedAt && <span className="text-[11px] text-white/30">aprovada em {approvedAt}</span>}
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gate-azure/40">
        <div className="flex items-center gap-3">
          <TrackLikeButton trackId={track.id} initialCount={track.likeCount} compact />
          <TrackRepostButton trackId={track.id} initialCount={track.repostCount} compact />
          {track.topReaction && track.topReactionCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-white/50" aria-label={`Reação mais popular: ${track.topReaction}, ${track.topReactionCount}`}>
              <span aria-hidden="true">{track.topReaction}</span>
              {track.topReactionCount.toLocaleString('pt-BR')}
            </span>
          )}
          <span className="text-xs text-white/40">
            {track.downloadCount.toLocaleString('pt-BR')} download{track.downloadCount !== 1 ? 's' : ''}
          </span>
        </div>

        {canDownload && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gate-pink hover:opacity-90 disabled:opacity-60 disabled:pointer-events-none rounded-md transition-colors shrink-0"
            aria-label={`Download de ${track.title}`}
          >
            {downloading ? (
              <LoadingSpinner />
            ) : (
              <DownloadIcon />
            )}
            <span className="hidden sm:inline">
              {downloading
                ? 'Preparando…'
                : gateLabel}
            </span>
          </button>
        )}
      </div>

      {showFollowModal && track.artist.userId && (
        <FollowToDownloadModal
          artistUserId={track.artist.userId}
          artistName={track.artist.name}
          artistHandle={track.artist.userHandle}
          artistPhotoUrl={track.artist.photoUrl}
          onClose={() => setShowFollowModal(false)}
          onFollowed={handleFollowed}
        />
      )}
    </article>
  )
}

// ── Sub-componentes ───────────────────────────────────────────

function MetaTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-white/5 text-gate-blue border border-gate-azure">
      {children}
    </span>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v8M5 7l3 3 3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 animate-spin" viewBox="0 0 24 24"
      fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
