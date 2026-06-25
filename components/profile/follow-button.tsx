'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  userId: string
  initialFollowing: boolean
}

export function FollowButton({ userId, initialFollowing }: FollowButtonProps) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        const data = await res.json()
        setFollowing(data.following)
        router.refresh()
      }
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
        'rounded-md px-5 py-2 text-sm font-semibold transition disabled:opacity-60',
        following
          ? 'border border-gate-azure bg-transparent text-white hover:border-red-500 hover:text-red-400'
          : 'bg-gate-pink text-white hover:opacity-90',
      ].join(' ')}
    >
      {following ? 'Seguindo' : 'Seguir'}
    </button>
  )
}
