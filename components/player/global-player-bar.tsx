'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePlayer } from './player-provider'
import { activeTracklistIndex } from '@/lib/tracks/tracklist'
import { PlayerReactionButton } from './player-reaction-button'

// ============================================================
// GlobalPlayerBar — barra fixa no rodapé (V3 Plano 1)
//
// Só aparece depois que alguma faixa foi tocada. Desktop: capa +
// título | controles + progresso | volume + fila. Mobile: linha
// compacta expansível. Renderiza também um espaçador em fluxo
// normal para o conteúdo da página não ficar atrás da barra
// (mesma lógica do md:pt-20 da topbar, só que embaixo).
// ============================================================

export function GlobalPlayerBar() {
  const {
    currentTrack, queue, queueIndex, isPlaying, isLoading, isVinheta,
    currentTime, duration, volume, shuffle, repeat, resumeToast,
    toggle, next, prev, seek, setVolume, toggleShuffle, cycleRepeat, playIndex,
    dismissResumeToast, restartFromBeginning,
  } = usePlayer()
  const [showQueue, setShowQueue] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (!currentTrack) return null

  const progress = duration > 0 && !isVinheta ? currentTime / duration : 0

  function handleSeekBar(e: React.MouseEvent<HTMLDivElement>) {
    if (isVinheta || duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    seek(ratio * duration)
  }

  const upcoming = queue.slice(queueIndex + 1)

  return (
    <>
      {/* Espaçador em fluxo — evita conteúdo escondido atrás da barra */}
      <div aria-hidden="true" className="h-16 md:h-20" />

      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-gate-azure bg-gate-bg/95 backdrop-blur supports-[backdrop-filter]:bg-gate-bg/85">
        {/* Toast discreto de retomada (V3 Plano 11) */}
        {resumeToast && resumeToast.trackId === currentTrack.id && (
          <div className="absolute bottom-full left-2 right-2 sm:left-auto sm:right-4 mb-2 flex items-center gap-2 rounded-lg border border-gate-azure bg-gate-bg px-3 py-2 text-xs text-gate-blue shadow-lg sm:w-auto">
            <span className="min-w-0 flex-1 sm:flex-none">
              Retomando de {formatTime(resumeToast.positionSeconds)}
            </span>
            <button
              onClick={restartFromBeginning}
              className="shrink-0 font-medium text-gate-pink hover:underline"
            >
              recomeçar
            </button>
            <button
              onClick={dismissResumeToast}
              className="shrink-0 text-white/40 hover:text-white/70"
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        )}

        {/* Painel de fila */}
        {showQueue && (
          <div className="absolute bottom-full right-2 mb-2 w-72 max-h-80 overflow-y-auto rounded-xl border border-gate-azure bg-gate-bg shadow-xl">
            <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gate-blue">
              Próximas na fila
            </p>
            {upcoming.length === 0 ? (
              <p className="px-4 pb-3 text-xs text-gate-blue">Fim da fila.</p>
            ) : (
              <ul className="pb-2">
                {upcoming.map((t, i) => (
                  <li key={`${t.id}-${i}`}>
                    <button
                      onClick={() => {
                        playIndex(queueIndex + 1 + i)
                        setShowQueue(false)
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-white/5"
                    >
                      <QueueCover track={t} />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-white">{t.title}</span>
                        <span className="block truncate text-[11px] text-gate-blue">{t.artistName}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Barra de progresso fina (clicável) — mobile e desktop */}
        <div
          onClick={handleSeekBar}
          role="slider"
          aria-label={isVinheta ? 'Tocando vinheta' : 'Progresso da faixa'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className={`group relative h-1 w-full ${isVinheta ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <div className="absolute inset-0 bg-gate-azure" />
          <div
            className={`absolute inset-y-0 left-0 ${isVinheta ? 'w-full animate-pulse bg-gate-azure' : 'bg-gate-pink'}`}
            style={isVinheta ? undefined : { width: `${progress * 100}%` }}
          />
        </div>

        {/* ── Desktop ── */}
        <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 h-[76px]">
          {/* Faixa atual */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/musicas/${currentTrack.slug}`}
              className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/10"
              aria-label={`Abrir página de ${currentTrack.title}`}
            >
              {currentTrack.coverUrl ? (
                <Image src={currentTrack.coverUrl} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <span className="absolute inset-0 bg-gradient-to-br from-gate-azure to-gate-bg" aria-hidden="true" />
              )}
            </Link>
            <div className="min-w-0">
              <Link
                href={`/musicas/${currentTrack.slug}`}
                className="block truncate text-sm font-medium text-white transition-colors hover:text-gate-pink"
              >
                {isVinheta ? 'Vinheta' : currentTrack.title}
              </Link>
              <p className="truncate text-xs text-gate-blue">{currentTrack.artistName}</p>
              <NowPlayingTrack />
            </div>
          </div>

          {/* Controles centrais */}
          <div className="flex items-center gap-1">
            <IconButton
              onClick={toggleShuffle}
              label={shuffle ? 'Desativar aleatório' : 'Ativar aleatório'}
              active={shuffle}
            >
              <ShuffleIcon />
            </IconButton>
            <IconButton onClick={prev} label="Faixa anterior">
              <PrevIcon />
            </IconButton>
            <button
              onClick={toggle}
              disabled={isLoading}
              className="mx-1 flex h-10 w-10 items-center justify-center rounded-full bg-gate-pink text-white transition hover:opacity-90 disabled:opacity-60"
              aria-label={isPlaying ? 'Pausar' : 'Tocar'}
            >
              {isLoading ? <SpinnerIcon /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <IconButton onClick={next} label="Próxima faixa">
              <NextIcon />
            </IconButton>
            <IconButton
              onClick={cycleRepeat}
              label={`Repetição: ${repeat === 'off' ? 'desligada' : repeat === 'all' ? 'fila' : 'faixa'}`}
              active={repeat !== 'off'}
            >
              <RepeatIcon one={repeat === 'one'} />
            </IconButton>
            <span className="ml-3 w-24 shrink-0 text-right text-[11px] tabular-nums text-gate-blue">
              {isVinheta ? 'vinheta' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
            </span>
          </div>

          {/* Volume + fila */}
          <div className="flex items-center justify-end gap-3">
            {!isVinheta && <PlayerReactionButton trackId={currentTrack.id} />}
            <VolumeIcon muted={volume === 0} />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-24 accent-gate-pink"
              aria-label="Volume"
            />
            <IconButton
              onClick={() => setShowQueue((s) => !s)}
              label="Fila de reprodução"
              active={showQueue}
            >
              <QueueIcon />
            </IconButton>
          </div>
        </div>

        {/* ── Mobile ── */}
        <div className="md:hidden">
          <div className="flex h-14 items-center gap-3 px-3">
            <Link
              href={`/musicas/${currentTrack.slug}`}
              className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white/10"
              aria-label={`Abrir página de ${currentTrack.title}`}
            >
              {currentTrack.coverUrl ? (
                <Image src={currentTrack.coverUrl} alt="" fill sizes="36px" className="object-cover" />
              ) : (
                <span className="absolute inset-0 bg-gradient-to-br from-gate-azure to-gate-bg" aria-hidden="true" />
              )}
            </Link>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="min-w-0 flex-1 text-left"
              aria-expanded={expanded}
              aria-label="Expandir player"
            >
              <p className="truncate text-sm font-medium text-white">
                {isVinheta ? 'Vinheta' : currentTrack.title}
              </p>
              <p className="truncate text-[11px] text-gate-blue">{currentTrack.artistName}</p>
              <NowPlayingTrack />
            </button>
            <button
              onClick={toggle}
              disabled={isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gate-pink text-white disabled:opacity-60"
              aria-label={isPlaying ? 'Pausar' : 'Tocar'}
            >
              {isLoading ? <SpinnerIcon /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <IconButton onClick={next} label="Próxima faixa">
              <NextIcon />
            </IconButton>
          </div>

          {/* Expandido: controles extras */}
          {expanded && (
            <div className="flex items-center justify-between gap-2 border-t border-gate-azure/50 px-3 py-2">
              <div className="flex items-center gap-1">
                <IconButton
                  onClick={toggleShuffle}
                  label={shuffle ? 'Desativar aleatório' : 'Ativar aleatório'}
                  active={shuffle}
                >
                  <ShuffleIcon />
                </IconButton>
                <IconButton onClick={prev} label="Faixa anterior">
                  <PrevIcon />
                </IconButton>
                <IconButton
                  onClick={cycleRepeat}
                  label={`Repetição: ${repeat === 'off' ? 'desligada' : repeat === 'all' ? 'fila' : 'faixa'}`}
                  active={repeat !== 'off'}
                >
                  <RepeatIcon one={repeat === 'one'} />
                </IconButton>
                <IconButton
                  onClick={() => setShowQueue((s) => !s)}
                  label="Fila de reprodução"
                  active={showQueue}
                >
                  <QueueIcon />
                </IconButton>
                {!isVinheta && <PlayerReactionButton trackId={currentTrack.id} />}
              </div>
              <span className="text-[11px] tabular-nums text-gate-blue">
                {isVinheta ? 'vinheta' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── "Tocando agora" da tracklist (V3 Plano 10) ────────────────
// Se a faixa atual tem tracklist, mostra sob o título a música do set que
// está tocando naquele instante (o "Track ID" caseiro). Busca 1x por faixa.

interface NowPlayingItem {
  startSeconds: number
  title: string
}

function NowPlayingTrack() {
  const { currentTrack, currentTime, isVinheta } = usePlayer()
  const [items, setItems] = useState<NowPlayingItem[]>([])

  const trackId = currentTrack?.id

  useEffect(() => {
    if (!trackId) {
      setItems([])
      return
    }
    let active = true
    fetch(`/api/social/tracks/${trackId}/tracklist`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return
        setItems(Array.isArray(data?.items) ? data.items : [])
      })
      .catch(() => {
        if (active) setItems([])
      })
    return () => {
      active = false
    }
  }, [trackId])

  if (isVinheta || items.length === 0) return null

  const idx = activeTracklistIndex(items, currentTime)
  if (idx < 0) return null

  return (
    <span className="block truncate text-[11px] text-gate-pink" title={items[idx].title}>
      ♪ {items[idx].title}
    </span>
  )
}

// ── Sub-componentes ───────────────────────────────────────────

function QueueCover({ track }: { track: { title: string; coverUrl: string | null } }) {
  return (
    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-white/10">
      {track.coverUrl ? (
        <Image src={track.coverUrl} alt="" fill sizes="32px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
          {track.title.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  )
}

function IconButton({
  onClick,
  label,
  active = false,
  children,
}: {
  onClick: () => void
  label: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:text-white ${
        active ? 'text-gate-pink' : 'text-gate-blue'
      }`}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

// ── Ícones ────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg className="ml-0.5 h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4 2.5v11a1 1 0 0 0 1.53.848l8-5.5a1 1 0 0 0 0-1.696l-8-5.5A1 1 0 0 0 4 2.5z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="3" y="2" width="3.5" height="12" rx="1" />
      <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function PrevIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3.5 2.5h1.8v11H3.5zM13 2.9v10.2a.7.7 0 0 1-1.1.57L5.6 8.57a.7.7 0 0 1 0-1.14l6.3-5.1A.7.7 0 0 1 13 2.9z" />
    </svg>
  )
}

function NextIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M10.7 2.5h1.8v11h-1.8zM3 2.9v10.2a.7.7 0 0 0 1.1.57l6.3-5.1a.7.7 0 0 0 0-1.14L4.1 2.33A.7.7 0 0 0 3 2.9z" />
    </svg>
  )
}

function ShuffleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1.5 4h2.6c1 0 1.9.5 2.5 1.3l3.3 4.4c.6.8 1.5 1.3 2.5 1.3h2.1M14.5 11l-2-2m2 2-2 2M1.5 12h2.6c.8 0 1.6-.35 2.2-.95M14.5 5l-2-2m2 2-2 2m2-2h-2.1c-1 0-1.9.5-2.5 1.3l-.4.55" />
    </svg>
  )
}

function RepeatIcon({ one }: { one: boolean }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 2.5l2 2-2 2m2-2H5a3 3 0 0 0-3 3v.5M5 13.5l-2-2 2-2m-2 2h8a3 3 0 0 0 3-3V8" />
      {one && <text x="6.2" y="10.5" fontSize="6" fill="currentColor" stroke="none">1</text>}
    </svg>
  )
}

function QueueIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2 4h12M2 8h12M2 12h7" />
      <path d="M12.5 10.5v4M14.5 12.3l-2-1.8-2 1.8" fill="none" />
    </svg>
  )
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg className="h-4 w-4 shrink-0 text-gate-blue" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 2.5a.7.7 0 0 0-1.14-.55L3.9 4.5H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1.9l2.96 2.55A.7.7 0 0 0 8 13.5v-11z" />
      {muted ? (
        <path d="M10.5 6l4 4m0-4l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5M12 3.5a6 6 0 0 1 0 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      )}
    </svg>
  )
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
