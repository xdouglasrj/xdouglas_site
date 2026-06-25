'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const OPTIONS = [24, 36, 48] as const

interface ContentExpirationCardProps {
  initialHours: number
}

export function ContentExpirationCard({ initialHours }: ContentExpirationCardProps) {
  const router = useRouter()
  const [hours, setHours] = useState(initialHours)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(nextHours: number) {
    if (busy || nextHours === hours) return
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/settings/content-expiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: nextHours }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError('Não foi possível salvar.')
        return
      }
      setHours(data.hours)
      setSaved(true)
      router.refresh()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-sm font-semibold text-white">Tempo de exibição de músicas e comentários</h2>
      <p className="mt-1 text-xs text-neutral-500 max-w-md">
        Depois desse prazo, as músicas postadas e os comentários do feed somem do
        catálogo e do início — mas continuam guardados no banco. Isso incentiva a
        comunidade a entrar com frequência para ver as novidades.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => save(opt)}
            disabled={busy}
            aria-pressed={hours === opt}
            className={[
              'rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:opacity-50',
              hours === opt
                ? 'border-rose-500 bg-rose-500/10 text-white'
                : 'border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-500',
            ].join(' ')}
          >
            {opt}h
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      {saved && !error && <p className="mt-3 text-xs text-emerald-400">Salvo.</p>}
    </div>
  )
}
