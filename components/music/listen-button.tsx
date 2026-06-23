'use client'

import { useState, useRef } from 'react'

interface ListenButtonProps {
  trackId: string
  title: string
  compact?: boolean
}

type State = 'idle' | 'loading' | 'playing' | 'error'

export function ListenButton({ trackId, title, compact = false }: ListenButtonProps) {
  const [state, setState] = useState<State>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    // Já está tocando — pausa
    if (state === 'playing' && audioRef.current) {
      audioRef.current.pause()
      setState('idle')
      return
    }

    if (state === 'loading') return

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
        return
      }

      if (!audioRef.current) {
        audioRef.current = new Audio()
        audioRef.current.addEventListener('ended', () => setState('idle'))
        audioRef.current.addEventListener('pause', () => setState('idle'))
      }

      audioRef.current.src = data.streamUrl
      await audioRef.current.play()
      setState('playing')
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className={
        compact
          ? 'flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/15 disabled:opacity-60 rounded-md transition-colors shrink-0'
          : 'flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-white text-sm bg-white/10 hover:bg-white/15 disabled:opacity-60 transition-colors'
      }
      aria-label={state === 'playing' ? `Pausar ${title}` : `Ouvir ${title}`}
    >
      <ListenIcon state={state} />
      {state === 'loading' ? 'Carregando…' : state === 'playing' ? 'Pausar' : state === 'error' ? 'Erro' : 'Ouvir'}
    </button>
  )
}

function ListenIcon({ state }: { state: State }) {
  if (state === 'loading') {
    return (
      <svg className="w-3.5 h-3.5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )
  }
  if (state === 'playing') {
    return (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="3" y="2" width="3.5" height="12" rx="1" />
        <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
      </svg>
    )
  }
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4 2.5v11a1 1 0 0 0 1.53.848l8-5.5a1 1 0 0 0 0-1.696l-8-5.5A1 1 0 0 0 4 2.5z" />
    </svg>
  )
}
