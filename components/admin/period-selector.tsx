'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { clsx } from 'clsx'

const PERIODS = [
  { label: '7 dias', value: '7' },
  { label: '14 dias', value: '14' },
  { label: '30 dias', value: '30' },
] as const

export function PeriodSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('days') ?? '30'

  function handleChange(days: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('days', days)
    router.push(`/admin/dashboard?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-neutral-800/60 border border-neutral-800">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => handleChange(p.value)}
          className={clsx(
            'px-3 py-1 rounded-md text-xs font-medium transition-colors',
            current === p.value
              ? 'bg-neutral-700 text-white'
              : 'text-neutral-500 hover:text-neutral-300'
          )}
          aria-pressed={current === p.value}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
