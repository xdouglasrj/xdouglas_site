'use client'

import { useEffect, useState } from 'react'
import { useAuthPopup } from '@/components/auth/AuthPopupProvider'
import { REACTION_EMOJIS, type ReactionEmoji } from '@/lib/reactions'

// ============================================================
// TrackReactions (V3 Plano 15) — linha de reações estilo Facebook,
// camada expressiva ADICIONAL ao TrackLike (não vale ponto, não
// influencia trending). 1 reação por usuário; trocar substitui.
// ============================================================

interface ReactionSummaryItem {
  emoji: ReactionEmoji
  count: number
}

interface TrackReactionsProps {
  trackId: string
  isLoggedIn?: boolean
}

export function TrackReactions({ trackId, isLoggedIn = true }: TrackReactionsProps) {
  const { openLogin } = useAuthPopup()
  const [myReaction, setMyReaction] = useState<ReactionEmoji | null>(null)
  const [summary, setSummary] = useState<ReactionSummaryItem[]>(
    REACTION_EMOJIS.map((emoji) => ({ emoji, count: 0 }))
  )
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) return
    let active = true
    fetch(`/api/social/tracks/${trackId}/reaction`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return
        setMyReaction(data.myReaction)
        if (Array.isArray(data.summary)) setSummary(data.summary)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [trackId, isLoggedIn])

  async function react(emoji: ReactionEmoji) {
    if (!isLoggedIn) {
      openLogin()
      return
    }
    if (busy) return
    setBusy(true)

    const isRemoving = myReaction === emoji
    const prevReaction = myReaction
    const prevSummary = summary

    // Otimista
    setMyReaction(isRemoving ? null : emoji)
    setSummary((prev) =>
      prev.map((item) => {
        if (item.emoji === emoji) return { ...item, count: item.count + (isRemoving ? -1 : 1) }
        if (item.emoji === prevReaction) return { ...item, count: Math.max(0, item.count - 1) }
        return item
      })
    )

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
        if (Array.isArray(data.summary)) setSummary(data.summary)
      } else if (res.status === 401) {
        setMyReaction(prevReaction)
        setSummary(prevSummary)
        openLogin()
      } else {
        setMyReaction(prevReaction)
        setSummary(prevSummary)
      }
    } catch {
      setMyReaction(prevReaction)
      setSummary(prevSummary)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Reações">
      {summary.map((item) => {
        const selected = myReaction === item.emoji
        return (
          <button
            key={item.emoji}
            type="button"
            onClick={() => react(item.emoji)}
            disabled={busy}
            className={[
              'flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-colors disabled:opacity-60',
              selected
                ? 'border-gate-pink bg-gate-pink/15 text-white'
                : 'border-gate-azure text-white/60 hover:border-gate-pink hover:text-white',
            ].join(' ')}
            aria-pressed={selected}
            aria-label={`Reagir com ${item.emoji}`}
          >
            <span aria-hidden="true">{item.emoji}</span>
            <span className="text-xs tabular-nums">{item.count.toLocaleString('pt-BR')}</span>
          </button>
        )
      })}
    </div>
  )
}
