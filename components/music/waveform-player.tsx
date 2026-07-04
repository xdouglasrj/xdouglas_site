'use client'

import { useMemo, useRef } from 'react'
import Image from 'next/image'
import { usePlayer, type PlayerTrack } from '@/components/player/player-provider'

// ============================================================
// Player com waveform — formato "post de áudio" (capa + botão
// de play sobreposto, barras de progresso, tempo decorrido).
// As barras são geradas de forma determinística a partir do
// trackId (não é uma análise real do áudio, é só visual).
//
// V3 Plano 1: virou uma "visão" do player global — não tem mais
// <audio> próprio. Play/pause/seek controlam o MESMO áudio da
// barra fixa do rodapé, e a contagem de plays acontece lá.
// ============================================================

interface WaveformPlayerProps {
  trackId: string
  slug: string
  title: string
  artistName: string
  coverUrl?: string | null
  /** false esconde a capa e mostra um botão de play redondo —
   * útil quando a página já exibe a capa grande em outro lugar. */
  showCover?: boolean
  barCount?: number
  /** Lista de origem — tocar esta faixa enfileira a lista a partir dela */
  queue?: PlayerTrack[]
}

export function WaveformPlayer({
  trackId,
  slug,
  title,
  artistName,
  coverUrl,
  showCover = true,
  barCount = 48,
  queue,
}: WaveformPlayerProps) {
  const player = usePlayer()
  const barsRef = useRef<HTMLDivElement | null>(null)
  const heights = useMemo(() => generateBars(trackId, barCount), [trackId, barCount])

  const isCurrent = player.currentTrack?.id === trackId
  const isPlaying = isCurrent && player.isPlaying && !player.isVinheta
  const isLoading = isCurrent && player.isLoading
  const isVinheta = isCurrent && player.isVinheta
  const currentTime = isCurrent && !isVinheta ? player.currentTime : 0
  const progress =
    isCurrent && !isVinheta && player.duration > 0
      ? player.currentTime / player.duration
      : 0

  const state: ButtonState = isLoading ? 'loading' : isPlaying ? 'playing' : 'idle'

  function togglePlay(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isLoading) return
    player.playTrack(
      { id: trackId, slug, title, artistName, coverUrl: coverUrl ?? null },
      queue,
    )
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (!isCurrent || isVinheta || player.duration <= 0 || !barsRef.current) return

    const rect = barsRef.current.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    player.seek(ratio * player.duration)
  }

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
          className={`flex-1 flex items-center gap-[2px] h-8 ${
            isVinheta || !isCurrent ? 'cursor-default' : 'cursor-pointer'
          }`}
          role="slider"
          aria-label={isVinheta ? 'Tocando vinheta' : `Progresso de ${title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          {heights.map((h, i) => {
            const played = i / heights.length <= progress && progress > 0
            return (
              <span
                key={i}
                className={`flex-1 min-w-[2px] rounded-full transition-colors ${
                  isVinheta ? 'bg-gate-azure animate-pulse' : played ? 'bg-gate-pink' : 'bg-gate-azure'
                }`}
                style={{ height: `${Math.round(h * 100)}%` }}
              />
            )
          })}
        </div>
        <span className={`text-[11px] text-gate-blue shrink-0 tabular-nums text-right ${isVinheta ? 'w-14' : 'w-9'}`}>
          {isVinheta ? 'vinheta' : formatTime(currentTime)}
        </span>
      </div>
    </div>
  )
}

// ── Ícones ────────────────────────────────────────────────────

type ButtonState = 'idle' | 'loading' | 'playing'

function PlayPauseIcon({ state }: { state: ButtonState }) {
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
