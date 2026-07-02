'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FEATURE_FLAG_KEYS, FEATURE_FLAG_LABELS, type FeatureFlagKey } from '@/lib/settings/feature-flags'

export function FeatureFlagsPanel({ initialFlags }: { initialFlags: Record<FeatureFlagKey, boolean> }) {
  const router = useRouter()
  const [flags, setFlags] = useState(initialFlags)
  const [busyKey, setBusyKey] = useState<FeatureFlagKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggle(key: FeatureFlagKey) {
    const next = !flags[key]
    setBusyKey(key)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags: { [key]: next } }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setFlags((prev) => ({ ...prev, [key]: next }))
      router.refresh()
    } catch {
      setError('Não foi possível salvar. Tente novamente.')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="space-y-2">
      {FEATURE_FLAG_KEYS.map((key) => {
        const { label, effect } = FEATURE_FLAG_LABELS[key]
        const enabled = flags[key]
        return (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4"
          >
            <div>
              <p className="text-sm font-medium text-neutral-200">{label}</p>
              <p className="text-xs text-neutral-500 mt-0.5 max-w-md">{effect}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              disabled={busyKey === key}
              onClick={() => toggle(key)}
              className={[
                'relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50',
                enabled ? 'bg-emerald-500' : 'bg-neutral-700',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white transition',
                  enabled ? 'left-5' : 'left-0.5',
                ].join(' ')}
              />
            </button>
          </div>
        )
      })}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}
