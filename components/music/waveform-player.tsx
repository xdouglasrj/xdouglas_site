'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

// ============================================================
// Player com waveform — formato "post de áudio" (capa + botão
// de play sobreposto, barras de progresso, tempo decorrido).
// As barras são geradas de forma determinística a partir do
// trackId (não é uma análise real do áudio, é só visual).
// ============================================================

interface WaveformPlayerProps {
  trackId: string
  title: string
  coverUrl?: string | null
  /** false esconde a capa e mostra um botão de play redondo —
   * útil quando a página já exibe a capa grande em outro lugar. */
  showCover?: boolean
  barCount?: number
}

type State = 'idle' | 'loading' | 'playing' | 'error'

export function WaveformPlayer({
  trackId,
  title,
  coverUrl,
  showCover = true,
  barCount = 48,
}: WaveformPlayerProps) {
  const [state, setState] = useState<State>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playingVinheta, setPlayingVinheta] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const vinhetaTriedRef = useRef(false)
  const barsRef = useRef<HTMLDivElement | null>(null)
  const heights = useMemo(() => generateBars(trackId, barCount), [trackId, barCount])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  // Ao fim da faixa, tenta encadear a vinheta (arquivo separado, tocado
  // dinamicamente pelo player — nunca concatenado no áudio original).
  async function tryPlayVinheta(audio: HTMLAudioElement): Promise<boolean> {
    try {
      const res = await fetch('/api/vinheta')
      if (!res.ok) return false
      const data = await res.json()
      if (!data.streamUrl) return false

      setState('loading')
      audio.src = data.streamUrl
      setPlayingVinheta(true)
      await audio.play()
      setState('playing')
      return true
    } catch {
      return false
    }
  }

  function resetAfterPlayback() {
    setState('idle')
    setCurrentTime(0)
    setPlayingVinheta(false)
    vinhetaTriedRef.current = false
    audioRef.current = null
  }

  async function ensureAudio(): Promise<HTMLAudioElement | null> {
    if (audioRef.current) return audioRef.current

    setState('loading')
    try {
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setState('error')
        setTimeout(() => setState('idle'), 3000)
        return null
      }

      const audio = new Audio(data.streamUrl)
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
      audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime))
      audio.addEventListener('ended', async () => {
        if (!vinhetaTriedRef.current) {
          vinhetaTriedRef.current = true
          const played = await tryPlayVinheta(audio)
          if (played) return
        }
        resetAfterPlayback()
      })
      audio.addEventListener('pause', () => {
        setState((s) => (s === 'loading' ? s : 'idle'))
      })
      audioRef.current = audio
      return audio
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
      return null
    }
  }

  async function togglePlay(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (state === 'playing') {
      audioRef.current?.pause()
      setState('idle')
      return
    }
    if (state === 'loading') return

    const audio = await ensureAudio()
    if (!audio) return

    await audio.play()
    setState('playing')
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (playingVinheta || !audioRef.current?.duration || !barsRef.current) return

    const rect = barsRef.current.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = ratio * audioRef.current.duration
    setCurrentTime(audioRef.current.currentTime)
  }

  const progress = duration && !playingVinheta ? currentTime / duration : 0

  return (
    <div className="flex items-center gap-3">
      {showCover ? (
        <button
          onClick={togglePlay}
          disabled={state === 'loading'}
          className="group relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-white/10"
          aria-label={state === 'playing' ? `Pausar ${title}` : `Ouvir ${title}`}
        >
          {coverUrl ? (
            <Image src={coverUrl} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gate-azure to-gate-bg" aria-hidden="true" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/45 transition-colors">
            <PlayPauseIcon state={state} />
          </span>
        </button>
      ) : (
        <button
          onClick={togglePlay}
          disabled={state === 'loading'}
          className="flex items-center justify-center w-11 h-11 shrink-0 rounded-full bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-60"
          aria-label={state === 'playing' ? `Pausar ${title}` : `Ouvir ${title}`}
        >
          <PlayPauseIcon state={state} />
        </button>
      )}

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div
          ref={barsRef}
          onClick={seek}
          className={`flex-1 flex items-center gap-[2px] h-8 ${playingVinheta ? 'cursor-default' : 'cursor-pointer'}`}
          role="slider"
          aria-label={playingVinheta ? 'Tocando vinheta' : `Progresso de ${title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          {heights.map((h, i) => {
            const played = i / heights.length <= progress
            return (
              <span
                key={i}
                className={`flex-1 min-w-[2px] rounded-full transition-colors ${
                  playingVinheta ? 'bg-gate-azure animate-pulse' : played ? 'bg-gate-pink' : 'bg-gate-azure'
                }`}
                style={{ height: `${Math.round(h * 100)}%` }}
              />
            )
          })}
        </div>
        <span className={`text-[11px] text-gate-blue shrink-0 tabular-nums text-right ${playingVinheta ? 'w-14' : 'w-9'}`}>
          {playingVinheta ? 'vinheta' : formatTime(currentTime)}
        </span>
      </div>
    </div>
  )
}

// ── Ícones ────────────────────────────────────────────────────

function PlayPauseIcon({ state }: { state: State }) {
  if (state === 'loading') {
    return (
      <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )
  }
  if (state === 'playing') {
    return (
      <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="3" y="2" width="3.5" height="12" rx="1" />
        <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
      </svg>
    )
  }
  if (state === 'error') {
    return (
      <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7.25 4.5h1.5v5h-1.5v-5zM7.25 10.5h1.5V12h-1.5v-1.5z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4 2.5v11a1 1 0 0 0 1.53.848l8-5.5a1 1 0 0 0 0-1.696l-8-5.5A1 1 0 0 0 4 2.5z" />
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Alturas pseudo-aleatórias (0.25–1), estáveis por trackId — gera o
 * desenho da waveform sem precisar analisar o áudio de verdade. */
function generateBars(seed: string, count: number): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  let state = h || 1

  function next(): number {
    state ^= state << 13
    state >>>= 0
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 4294967295
  }

  const bars: number[] = []
  for (let i = 0; i < count; i++) {
    bars.push(0.25 + next() * 0.75)
  }
  return bars
}
