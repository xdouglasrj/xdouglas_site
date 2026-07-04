'use client'

import { useEffect, useState } from 'react'

// ============================================================
// V3 Plano 6 — countdown regressivo ao vivo (dias/horas/min/seg) até o
// deadline do contest. Client-only por causa do setInterval; o resto da
// página do contest continua SSR. Usa o fuso do NAVEGADOR do usuário
// (Date do JS já converte automaticamente).
// ============================================================

interface ContestCountdownProps {
  deadline: string // ISO
  compact?: boolean
}

interface TimeLeft {
  ended: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
}

function computeTimeLeft(deadline: string): TimeLeft {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0 }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { ended: false, days, hours, minutes, seconds }
}

export function ContestCountdown({ deadline, compact = false }: ContestCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTimeLeft(computeTimeLeft(deadline))
    const id = setInterval(() => setTimeLeft(computeTimeLeft(deadline)), 1000)
    return () => clearInterval(id)
  }, [deadline])

  // Antes de montar (SSR/hidratação), evita "flash" de números errados
  if (!timeLeft) return <span className="text-xs text-gate-blue">…</span>

  if (timeLeft.ended) {
    return (
      <span className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-400">
        Encerrado
      </span>
    )
  }

  if (compact) {
    return (
      <span className="inline-flex items-center rounded-full border border-gate-pink/50 bg-gate-pink/10 px-2.5 py-1 text-xs font-semibold text-gate-pink">
        {timeLeft.days > 0 ? `${timeLeft.days} dia${timeLeft.days === 1 ? '' : 's'} restante${timeLeft.days === 1 ? '' : 's'}` : 'Últimas horas'}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <CountdownUnit value={timeLeft.days} label="dias" />
      <CountdownUnit value={timeLeft.hours} label="horas" />
      <CountdownUnit value={timeLeft.minutes} label="min" />
      <CountdownUnit value={timeLeft.seconds} label="seg" />
    </div>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gate-azure bg-white/5 px-3 py-2 min-w-[3.5rem]">
      <span className="text-lg font-bold tabular-nums text-white">{String(value).padStart(2, '0')}</span>
      <span className="text-[10px] uppercase tracking-wider text-gate-blue">{label}</span>
    </div>
  )
}
