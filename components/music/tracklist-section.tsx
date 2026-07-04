'use client'

import { useEffect, useRef, useState } from 'react'
import { usePlayer, type PlayerTrack } from '@/components/player/player-provider'
import { formatTimestamp, activeTracklistIndex } from '@/lib/tracks/tracklist'

// ============================================================
// Tracklist da página da faixa (V3 Plano 10)
//
// Renderizada no SERVIDOR (é client component, mas o SSR do Next já emite
// os títulos no HTML → SEO). Clicar numa linha faz seek no player global;
// se a faixa da página não é a que está tocando, ela começa e o seek é
// aplicado assim que carrega. A linha "tocando agora" fica destacada.
// ============================================================

const COLLAPSE_THRESHOLD = 10

interface TracklistItem {
  position: number
  startSeconds: number
  title: string
}

interface TracklistSectionProps {
  items: TracklistItem[]
  playerTrack: PlayerTrack
}

export function TracklistSection({ items, playerTrack }: TracklistSectionProps) {
  const { currentTrack, currentTime, duration, isVinheta, seek, playTrack } = usePlayer()
  const [expanded, setExpanded] = useState(false)
  const pendingSeekRef = useRef<number | null>(null)

  const isCurrent = currentTrack?.id === playerTrack.id && !isVinheta

  // Aplica o seek pendente assim que a faixa vira a atual e tem duração
  // (evita seek antes do <audio> carregar). currentTime nas deps garante
  // que reavalia a cada tick após o play.
  useEffect(() => {
    if (isCurrent && duration > 0 && pendingSeekRef.current !== null) {
      seek(pendingSeekRef.current)
      pendingSeekRef.current = null
    }
  }, [isCurrent, duration, currentTime, seek])

  function handleLineClick(startSeconds: number) {
    if (isCurrent) {
      seek(startSeconds)
    } else {
      pendingSeekRef.current = startSeconds
      playTrack(playerTrack)
    }
  }

  if (items.length === 0) return null

  const activeIndex = isCurrent ? activeTracklistIndex(items, currentTime) : -1
  const isCollapsible = items.length > COLLAPSE_THRESHOLD
  const visibleItems = isCollapsible && !expanded ? items.slice(0, COLLAPSE_THRESHOLD) : items

  return (
    <section className="mt-10 pt-8 border-t border-gate-azure">
      <h2 className="text-sm font-semibold text-gate-blue uppercase tracking-wide mb-3">
        Tracklist <span className="text-white/30 font-normal">({items.length})</span>
      </h2>

      <ol className="divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
        {visibleItems.map((item, i) => {
          const isActive = i === activeIndex
          return (
            <li key={item.position}>
              <button
                type="button"
                onClick={() => handleLineClick(item.startSeconds)}
                aria-current={isActive ? 'true' : undefined}
                className={`flex w-full items-baseline gap-3 px-4 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-gate-pink/10' : 'hover:bg-white/5'
                }`}
              >
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-white/30">
                  {item.position}
                </span>
                <span className="w-14 shrink-0 text-xs tabular-nums text-gate-pink">
                  {formatTimestamp(item.startSeconds)}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    isActive ? 'font-medium text-white' : 'text-white/80'
                  }`}
                >
                  {isActive && <span aria-hidden="true">♪ </span>}
                  {item.title}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {isCollapsible && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 text-xs font-semibold text-gate-pink transition hover:opacity-80"
        >
          {expanded ? 'Mostrar menos' : `Ver todas as ${items.length} faixas`}
        </button>
      )}
    </section>
  )
}
