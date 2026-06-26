'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAnalytics } from '@/components/analytics/use-analytics'
import { ListenButton } from './listen-button'
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
// Componente — linha horizontal, estilo lista de arquivos
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
    <article className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-white/[0.06]">
      {/* Capa — miniatura, como o ícone de um arquivo */}
      <Link
        href={`/musicas/${track.slug}`}
        className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-white/5"
        onClick={() => trackMusicView(track.id)}
      >
        {track.coverUrl ? (
          <Image
            src={track.coverUrl}
            alt={`Capa de ${track.title}`}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <CoverPlaceholder title={track.title} />
        )}
      </Link>

      {/* Nome + metadados — cresce para ocupar o espaço, como o nome do arquivo */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/musicas/${track.slug}`}
          onClick={() => trackMusicView(track.id)}
          className="block"
        >
          <h2 className="font-semibold text-white text-sm truncate group-hover:text-gate-pink transition-colors">
            {track.title}
          </h2>
        </Link>

        <p className="mt-0.5 text-xs text-gate-blue truncate">
          {track.artist.name}
          {track.producerName && track.producerName !== track.artist.name && (
            <span className="text-white/40"> · prod. {track.producerName}</span>
          )}
        </p>
        {approvedAt && (
          <p className="mt-0.5 text-[11px] text-white/30 truncate">aprovada em {approvedAt}</p>
        )}
      </div>

      {/* Tags de metadados — escondem em telas estreitas */}
      <div className="hidden sm:flex flex-wrap items-center gap-1.5 shrink-0">
        {track.genre && <MetaTag>{track.genre}</MetaTag>}
        {track.bpm && <MetaTag>{track.bpm} BPM</MetaTag>}
        {fileSize && <MetaTag>{fileSize}</MetaTag>}
        <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded bg-white/5 text-gate-blue border border-gate-azure">
          {track.audioFormat}
        </span>
      </div>

      {/* Contador de downloads */}
      <span className="hidden md:inline text-xs text-white/40 shrink-0 w-24 text-right">
        {track.downloadCount.toLocaleString('pt-BR')} download{track.downloadCount !== 1 ? 's' : ''}
      </span>

      {/* Ações */}
      <div className="flex items-center gap-1.5 shrink-0">
        <TrackLikeButton trackId={track.id} initialCount={track.likeCount} compact />
        <ListenButton trackId={track.id} title={track.title} compact />

        {canDownload && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gate-pink hover:opacity-90 disabled:opacity-60 disabled:pointer-events-none rounded-md transition-colors"
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

function CoverPlaceholder({ title }: { title: string }) {
  const colors = [
    'from-rose-900 to-gate-bg',
    'from-violet-900 to-gate-bg',
    'from-amber-900 to-gate-bg',
    'from-teal-900 to-gate-bg',
    'from-sky-900 to-gate-bg',
  ]
  const idx = title.charCodeAt(0) % colors.length
  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br ${colors[idx]} flex items-center justify-center`}
      aria-hidden="true"
    >
      <span className="text-base font-bold text-white/30 select-none">
        {title.charAt(0).toUpperCase()}
      </span>
    </div>
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
