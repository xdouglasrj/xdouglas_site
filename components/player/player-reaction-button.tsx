'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuthPopup } from '@/components/auth/AuthPopupProvider'
import { REACTION_EMOJIS, type ReactionEmoji } from '@/lib/reactions'

// ============================================================
// PlayerReactionButton (V3 Plano 15) — botão 🔥 compacto na barra
// do player global; abre picker das 6 opções para reagir sem
// sair da barra, enquanto ouve. Reações NÃO valem ponto e NÃO
// influenciam trending (só o TrackLike é métrica principal).
// ============================================================

interface PlayerReactionButtonProps {
  trackId: string
  isLoggedIn?: boolean
}

export function PlayerReactionButton({ trackId, isLoggedIn = true }: PlayerReactionButtonProps) {
  const { openLogin } = useAuthPopup()
  const [myReaction, setMyReaction] = useState<ReactionEmoji | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMyReaction(null)
    setOpen(false)
  }, [trackId])

  useEffect(() => {
    if (!isLoggedIn) return
    let active = true
    fetch(`/api/social/tracks/${trackId}/reaction`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setMyReaction(data.myReaction)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [trackId, isLoggedIn])

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleToggleOpen() {
    if (!isLoggedIn) {
      openLogin()
      return
    }
    setOpen((v) => !v)
  }

  async function react(emoji: ReactionEmoji) {
    if (busy) return
    setBusy(true)
    const isRemoving = myReaction === emoji
    const prev = myReaction
    setMyReaction(isRemoving ? null : emoji)
    setOpen(false)

    try {
      const res = isRemoving
        ? await fetch(`/api/social/tracks/${trackId}/reaction`, { method: 'DELETE' })
        : await fetch(`/api/social/tracks/${trackId}/reaction`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emoji }),
          })

      if (res.ok) {
        const data = await res.json()
        setMyReaction(data.myReaction)
      } else if (res.status === 401) {
        setMyReaction(prev)
        openLogin()
      } else {
        setMyReaction(prev)
      }
    } catch {
      setMyReaction(prev)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggleOpen}
        disabled={busy}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:text-white disabled:opacity-60 ${
          myReaction ? 'text-gate-pink' : 'text-gate-blue'
        }`}
        aria-label={myReaction ? `Sua reação: ${myReaction}` : 'Reagir à faixa'}
        aria-expanded={open}
      >
        <span aria-hidden="true">{myReaction ?? '🔥'}</span>
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 flex items-center gap-1 rounded-full border border-gate-azure bg-gate-bg px-2 py-1.5 shadow-xl">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => react(emoji)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 ${
                myReaction === emoji ? 'bg-gate-pink/20' : ''
              }`}
              aria-label={`Reagir com ${emoji}`}
            >
              <span aria-hidden="true">{emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
