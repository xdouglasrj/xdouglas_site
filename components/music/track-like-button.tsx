'use client'

import { useEffect, useState } from 'react'

interface TrackLikeButtonProps {
  trackId: string
  initialCount: number
  compact?: boolean
}

export function TrackLikeButton({ trackId, initialCount, compact = false }: TrackLikeButtonProps) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)

  // Estado de curtida é por usuário — busca assim que monta, sem bloquear a contagem inicial
  useEffect(() => {
    let active = true
    fetch(`/api/social/tracks/${trackId}/like`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setLiked(data.liked)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [trackId])

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)

    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => c + (nextLiked ? 1 : -1))

    try {
      const res = await fetch(`/api/social/tracks/${trackId}/like`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setLiked(data.liked)
      } else {
        // Reverte em caso de erro
        setLiked(!nextLiked)
        setCount((c) => c + (nextLiked ? -1 : 1))
      }
    } catch {
      setLiked(!nextLiked)
      setCount((c) => c + (nextLiked ? -1 : 1))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={[
        'flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-60',
        compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-1.5 text-sm',
        liked ? 'text-gate-pink' : 'text-white/50 hover:text-gate-pink',
      ].join(' ')}
      aria-label={liked ? 'Descurtir' : 'Curtir'}
      aria-pressed={liked}
    >
      <HeartIcon filled={liked} />
      <span>{count.toLocaleString('pt-BR')}</span>
    </button>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-6 h-6 shrink-0"
      viewBox="0 0 16 16"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 13.5s-5.5-3.36-7-6.6C-0.1 4.2 1.3 2 3.8 2c1.4 0 2.7.8 3.3 2 0.6-1.2 1.9-2 3.3-2 2.5 0 3.9 2.2 2.8 4.9-1.5 3.24-7 6.6-7 6.6z" />
    </svg>
  )
}
