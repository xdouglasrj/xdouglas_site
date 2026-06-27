'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAnalytics } from '@/components/analytics/use-analytics'
import { WaveformPlayer } from './waveform-player'
import { TrackLikeButton } from './track-like-button'
import type { TrackPublic } from '@/lib/tracks/types'

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
}

export function TrackCard({ track, canDownload = true }: TrackCardProps) {
  const { trackMusicView } = useAnalytics()
  const [downloading, setDownloading] = useState(false)

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault()
    if (downloading) return

    trackMusicView(track.id)
    setDownloading(true)

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id }),
      })

      const data = await res.json()

      if (res.ok && data.downloadUrl) {
        window.location.href = data.downloadUrl
      }
      // Erros na linha são silenciosos — redireciona para página de detalhe
      // onde o botão tem feedback mais rico
    } catch {
      // Silencioso na linha
    } finally {
      setTimeout(() => setDownloading(false), 3_000)
    }
  }

  const fileSize = formatBytes(track.audioSizeBytes)
  const approvedAt = formatDate(track.publishedAt)

  return (
    <article className="rounded-2xl border border-gate-azure bg-white/5 p-4 transition-colors hover:bg-white/[0.07]">
      {/* Nome da música + dj/produtor */}
      <Link
        href={`/musicas/${track.slug}`}
        onClick={() => trackMusicView(track.id)}
        className="group block"
      >
        <h2 className="font-semibold text-white text-sm truncate group-hover:text-gate-pink transition-colors">
          {track.title}
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
        <WaveformPlayer trackId={track.id} title={track.title} coverUrl={track.coverUrl} />
      </div>

      {/* Tags de metadados */}
      <div className="hidden sm:flex flex-wrap items-center gap-1.5 mt-3">
        {track.genre && <MetaTag>{track.genre}</MetaTag>}
        {track.bpm && <MetaTag>{track.bpm} BPM</MetaTag>}
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
            <span className="hidden sm:inline">{downloading ? 'Preparando…' : 'Download'}</span>
          </button>
        )}
      </div>
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
