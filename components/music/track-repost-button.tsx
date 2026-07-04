'use client'

import { useEffect, useState } from 'react'
import { useAuthPopup } from '@/components/auth/AuthPopupProvider'

// ============================================================
// Botão de repost (V3 Plano 3) — molde do track-like-button.
// Repostar coloca a faixa na seção "Reposts" do perfil.
// ============================================================

interface TrackRepostButtonProps {
  trackId: string
  initialCount: number
  compact?: boolean
  isLoggedIn?: boolean
  /** true quando a faixa é do próprio usuário — esconde o botão */
  isOwnTrack?: boolean
}

export function TrackRepostButton({
  trackId,
  initialCount,
  compact = false,
  isLoggedIn = true,
  isOwnTrack = false,
}: TrackRepostButtonProps) {
  const { openLogin } = useAuthPopup()
  const [reposted, setReposted] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isLoggedIn || isOwnTrack) return
    let active = true
    fetch(`/api/social/tracks/${trackId}/repost`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setReposted(data.reposted)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [trackId, isLoggedIn, isOwnTrack])

  if (isOwnTrack) return null

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) {
      openLogin()
      return
    }
    if (busy) return
    setBusy(true)

    const nextReposted = !reposted
    setReposted(nextReposted)
    setCount((c) => c + (nextReposted ? 1 : -1))

    try {
      const res = await fetch(`/api/social/tracks/${trackId}/repost`, {
        method: nextReposted ? 'POST' : 'DELETE',
      })
      if (res.ok) {
        const data = await res.json()
        setReposted(data.reposted)
        setCount(data.repostCount)
      } else if (res.status === 401) {
        // Sessão anônima/expirada — reverte e abre login
        setReposted(!nextReposted)
        setCount((c) => c + (nextReposted ? -1 : 1))
        openLogin()
      } else {
        setReposted(!nextReposted)
        setCount((c) => c + (nextReposted ? -1 : 1))
      }
    } catch {
      setReposted(!nextReposted)
      setCount((c) => c + (nextReposted ? -1 : 1))
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
        reposted ? 'text-gate-pink' : 'text-white/50 hover:text-gate-pink',
      ].join(' ')}
      aria-label={reposted ? 'Desfazer repost' : 'Repostar'}
      aria-pressed={reposted}
    >
      <RepostIcon />
      <span>{count.toLocaleString('pt-BR')}</span>
    </button>
  )
}

function RepostIcon() {
  return (
    <svg
      className="w-6 h-6 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Setas em ciclo, estilo retweet */}
      <path d="M4.5 5.5h6a2 2 0 0 1 2 2V8M10.5 3.5l2 2-2 2" />
      <path d="M11.5 10.5h-6a2 2 0 0 1-2-2V8M5.5 12.5l-2-2 2-2" />
    </svg>
  )
}
