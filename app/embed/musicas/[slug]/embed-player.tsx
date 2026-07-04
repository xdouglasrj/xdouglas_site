'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useAnalytics } from '@/components/analytics/use-analytics'

interface EmbedPlayerProps {
  trackId: string
  slug: string
  title: string
  artistName: string
  artistSlug: string
  coverUrl: string | null
}

// ============================================================
// EmbedPlayer — <audio> próprio e isolado (V3 Plano 8)
//
// Busca a URL assinada só quando o visitante clica em play (evita gastar
// TTL de 30min do /api/stream em embeds que ninguém toca). Rate limit
// por IP já é aplicado no /api/stream (mesma proteção do site principal).
// ============================================================

type PlayState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export function EmbedPlayer({ trackId, slug, title, artistName, artistSlug, coverUrl }: EmbedPlayerProps) {
  const [state, setState] = useState<PlayState>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const playStartFiredRef = useRef(false)
  const { trackPlayStart } = useAnalytics()

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  function ensureAudio(): HTMLAudioElement {
    if (audioRef.current) return audioRef.current
    const audio = new Audio()
    audio.preload = 'none'
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime))
    audio.addEventListener('play', () => {
      setState('playing')
      // Play no embed conta como play normal (mesmos eventos do player
      // global) — respeita o mesmo gate de consentimento de analytics do
      // site principal (best-effort: some iframes de terceiros podem nunca
      // ter dado consentimento, então nem todo play do embed é contado).
      if (!playStartFiredRef.current) {
        playStartFiredRef.current = true
        trackPlayStart(trackId)
      }
    })
    audio.addEventListener('pause', () => {
      setState((s) => (s === 'loading' ? s : 'paused'))
    })
    audio.addEventListener('ended', () => {
      setState('paused')
      setCurrentTime(0)
    })
    audio.addEventListener('error', () => setState('error'))
    audioRef.current = audio
    return audio
  }

  async function togglePlay() {
    const audio = ensureAudio()

    if (state === 'playing') {
      audio.pause()
      return
    }
    if (audio.src) {
      try {
        await audio.play()
      } catch {
        setState('error')
      }
      return
    }

    setState('loading')
    try {
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      })
      const data = await res.json()
      if (!res.ok || !data.streamUrl) {
        setState('error')
        return
      }
      audio.src = data.streamUrl
      await audio.play()
    } catch {
      setState('error')
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !isFinite(audio.duration) || !barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audio.duration
    setCurrentTime(audio.currentTime)
  }

  const progress = duration > 0 ? currentTime / duration : 0
  const trackUrl = `https://xdouglas.com.br/musicas/${slug}`
  const artistUrl = `https://xdouglas.com.br/artista/${artistSlug}`

  return (
    <div className="flex h-full min-h-[120px] w-full items-center gap-3 bg-gate-bg px-4 py-3 text-white">
      <button
        type="button"
        onClick={togglePlay}
        disabled={state === 'loading'}
        className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10"
        aria-label={state === 'playing' ? `Pausar ${title}` : `Ouvir ${title}`}
      >
        {coverUrl ? (
          <Image src={coverUrl} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gate-azure to-gate-bg" aria-hidden="true" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/45">
          <PlayPauseIcon state={state} />
        </span>
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="min-w-0 truncate">
          <a
            href={trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-semibold text-white hover:text-gate-pink"
          >
            {title}
          </a>
          <span className="text-white/40"> · </span>
          <a
            href={artistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gate-blue hover:text-gate-pink"
          >
            {artistName}
          </a>
        </div>

        <div className="flex items-center gap-2">
          <div
            ref={barRef}
            onClick={seek}
            className="h-1.5 flex-1 cursor-pointer rounded-full bg-white/10"
            role="slider"
            aria-label={`Progresso de ${title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div
              className="h-full rounded-full bg-gate-pink transition-[width]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-gate-blue">
            {formatTime(currentTime)}
          </span>
        </div>

        {state === 'error' && (
          <p className="text-[11px] text-gate-pink">Não foi possível carregar o áudio.</p>
        )}
      </div>

      <a
        href="https://xdouglas.com.br"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 self-start opacity-70 transition-opacity hover:opacity-100"
        aria-label="Ouça no xDouglas"
      >
        <Image
          src="/brand/xdouglas-logo.png"
          alt="xDouglas"
          width={1200}
          height={675}
          className="h-5 w-auto object-contain"
        />
      </a>
    </div>
  )
}

function PlayPauseIcon({ state }: { state: PlayState }) {
  if (state === 'loading') {
    return (
      <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )
  }
  if (state === 'playing') {
    return (
      <svg className="h-5 w-5 text-white" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="3" y="2" width="3.5" height="12" rx="1" />
        <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5 text-white" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4 2.5v11a1 1 0 0 0 1.53.848l8-5.5a1 1 0 0 0 0-1.696l-8-5.5A1 1 0 0 0 4 2.5z" />
    </svg>
  )
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
