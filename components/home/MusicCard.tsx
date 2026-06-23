'use client'

import { useRef, useState } from 'react'
import { useAnalytics } from '@/components/analytics/use-analytics'
import type { MockTrack } from '@/data/mockTracks'

const GENRE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  'Deep House':     { bg: '#0d1a2e', color: '#4a9eff', border: '#0f2540' },
  'House':          { bg: '#0d1a2e', color: '#4a9eff', border: '#0f2540' },
  'Ambient House':  { bg: '#001a1a', color: '#22d3ee', border: '#002828' },
  'Trap':           { bg: '#1e0a00', color: '#ff6b1a', border: '#2e1200' },
  'Hip-Hop':        { bg: '#1e0a00', color: '#ff6b1a', border: '#2e1200' },
  'Afrobeats':      { bg: '#001a0d', color: '#22c55e', border: '#002a14' },
  'R&B':            { bg: '#1a0020', color: '#c084fc', border: '#280030' },
  'Techno':         { bg: '#1a0008', color: '#f43f5e', border: '#280010' },
  'Minimal Techno': { bg: '#1a0008', color: '#f43f5e', border: '#280010' },
  'Electro':        { bg: '#1a001a', color: '#e879f9', border: '#280028' },
}

function formatNumber(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

interface MusicRowProps {
  track: MockTrack
  index: number
  playCount: number
  onPlayCountIncrement: () => void
}

export function MusicRow({ track, index, playCount, onPlayCountIncrement }: MusicRowProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<number>(0)
  const countedRef = useRef(false)
  const { trackMusicView } = useAnalytics()

  const genreStyle = GENRE_STYLES[track.genre] ?? { bg: '#111', color: '#888', border: '#222' }

  function startPlay() {
    setIsPlaying(true)
    countedRef.current = false
    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const pct = Math.min((elapsed / 30) * 100, 100)
      setProgress(pct)
      if (elapsed >= 30 && !countedRef.current) {
        countedRef.current = true
        onPlayCountIncrement()
        trackMusicView(track.id)
        clearInterval(timerRef.current!)
      }
    }, 250)
  }

  function stopPlay() {
    setIsPlaying(false)
    setProgress(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    isPlaying ? stopPlay() : startPlay()
  }

  return (
    <div
      className={`group grid items-center gap-0 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
        isPlaying
          ? 'bg-[#12040a] border-[#e8365d]/15'
          : 'bg-transparent border-transparent hover:bg-[#0f0f0f] hover:border-[#1c1c1c]'
      }`}
      style={{ gridTemplateColumns: '32px 36px 1fr 108px 88px 68px 72px 64px 52px' }}
      onClick={toggle}
    >
      {/* Número / ícone ativo */}
      <div className="text-center">
        {isPlaying ? (
          <svg className="mx-auto h-3 w-3 text-[#e8365d]" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="16" y="3" width="5" height="18" rx="1" />
          </svg>
        ) : (
          <span className="text-[11px] font-semibold text-[#383838]">{index + 1}</span>
        )}
      </div>

      {/* Capa */}
      <div
        className="h-8 w-8 rounded-md flex items-center justify-center text-sm font-black"
        style={{ background: `${track.coverColor}22`, border: `1px solid ${track.coverColor}33`, color: track.coverColor }}
      >
        {track.title[0]}
      </div>

      {/* Nome + produtor + barra de progresso */}
      <div className="min-w-0 pl-2.5 pr-2">
        <p className={`truncate text-[12px] font-bold leading-tight ${isPlaying ? 'text-[#e8365d]' : 'text-[#e8e8e8]'}`}>
          {track.title}
        </p>
        <p className="truncate text-[10px] text-[#444] mt-0.5">{track.artist}</p>
        {isPlaying && (
          <div className="mt-1.5 h-[2px] w-full rounded-full bg-[#1a1a1a] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#e8365d] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Gênero */}
      <div>
        <span
          className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide truncate max-w-[104px]"
          style={{ background: genreStyle.bg, color: genreStyle.color, border: `1px solid ${genreStyle.border}` }}
        >
          {track.genre}
        </span>
      </div>

      {/* Data */}
      <div className="text-[10px] text-[#444]">{track.date}</div>

      {/* Formato */}
      <div>
        <span
          className={`text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded ${
            track.format === 'WAV'
              ? 'bg-[#1a1200] text-[#c8960a] border border-[#281e00]'
              : 'bg-[#060f1c] text-[#3a8fd4] border border-[#0c1e30]'
          }`}
        >
          {track.format}
        </span>
      </div>

      {/* Downloads */}
      <div className="flex items-center justify-end gap-1 text-[11px] text-[#484848]">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {formatNumber(track.downloads)}
      </div>

      {/* Plays */}
      <div className="text-right">
        <p className={`text-[12px] font-bold leading-tight ${isPlaying && progress > 0 ? 'text-[#e8365d]' : 'text-[#e0e0e0]'}`}>
          {formatNumber(playCount)}
        </p>
        <p className="text-[8px] text-[#333] tracking-wider uppercase">Plays</p>
      </div>

      {/* Botão play */}
      <div className="flex justify-end" onClick={toggle}>
        <button
          aria-label={`${isPlaying ? 'Pausar' : 'Reproduzir'} ${track.title}`}
          className={`h-[26px] w-[26px] rounded-full flex items-center justify-center border transition-all ${
            isPlaying
              ? 'bg-[#e8365d] border-[#e8365d] text-white'
              : 'bg-transparent border-[#1e1e1e] text-[#444] hover:bg-[#e8365d] hover:border-[#e8365d] hover:text-white'
          }`}
        >
          {isPlaying ? (
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <rect x="4" y="4" width="5" height="16" rx="1"/><rect x="15" y="4" width="5" height="16" rx="1"/>
            </svg>
          ) : (
            <svg className="h-3 w-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
