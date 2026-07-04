'use client'

import { useEffect, useState } from 'react'
import { getLocalResumePosition } from '@/components/player/resume-storage'

// ============================================================
// Barrinha fina "já ouvido" estilo YouTube (V3 Plano 11) — some quando
// não há progresso salvo ou a faixa não é longa o bastante para retomar.
// ============================================================

const MIN_DURATION_FOR_RESUME_SECONDS = 10 * 60

interface TrackProgressBarProps {
  trackId: string
  durationSeconds: number | null
  isLoggedIn?: boolean
}

export function TrackProgressBar({ trackId, durationSeconds, isLoggedIn = true }: TrackProgressBarProps) {
  const [positionSeconds, setPositionSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!durationSeconds || durationSeconds < MIN_DURATION_FOR_RESUME_SECONDS) return
    let active = true

    if (!isLoggedIn) {
      setPositionSeconds(getLocalResumePosition(trackId))
      return
    }

    fetch(`/api/social/tracks/${trackId}/progress`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && typeof data.positionSeconds === 'number') {
          setPositionSeconds(data.positionSeconds)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [trackId, durationSeconds, isLoggedIn])

  if (!durationSeconds || positionSeconds === null) return null
  const ratio = Math.min(1, Math.max(0, positionSeconds / durationSeconds))
  if (ratio <= 0) return null

  return (
    <div
      className="h-[3px] w-full rounded-full bg-white/10 overflow-hidden"
      role="img"
      aria-label={`Já ouvido: ${Math.round(ratio * 100)}%`}
    >
      <div className="h-full bg-gate-pink/70" style={{ width: `${ratio * 100}%` }} />
    </div>
  )
}
