'use client'

import { useEffect, useState } from 'react'
import type { StorePurchase } from '@prisma/client'

interface Target {
  id: string
  label: string
}

export function UseItemModal({
  purchase,
  onClose,
  onUsed,
}: {
  purchase: StorePurchase & { storeItem: { key: string; label: string } }
  onClose: () => void
  onUsed: () => void
}) {
  const [targets, setTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/store/targets?itemKey=${purchase.storeItem.key}`)
      .then((res) => res.json())
      .then((data) => setTargets(data.targets ?? []))
      .finally(() => setLoading(false))
  }, [purchase.storeItem.key])

  async function handleSelect(targetId: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/store/purchases/${purchase.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId }),
      })
      const data = await res.json()
      if (res.ok) {
        onUsed()
      } else {
        alert(data.error ?? 'Erro ao usar o item')
      }
    } finally {
      setBusy(false)
    }
  }

  const filtered = targets.filter((t) => t.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 p-6">
        <h2 className="text-base font-semibold text-white mb-1">{purchase.storeItem.label}</h2>
        <p className="text-xs text-neutral-500 mb-4">Escolha onde aplicar — não dá pra trocar depois de usado.</p>

        {targets.length > 10 && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pelo nome..."
            className="w-full mb-3 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
          />
        )}

        {loading ? (
          <p className="text-sm text-neutral-500">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-neutral-500">Nada disponível pra escolher ainda.</p>
        ) : (
          <ul className="max-h-72 overflow-y-auto space-y-1">
            {filtered.map((t) => (
              <li key={t.id}>
                <button
                  disabled={busy}
                  onClick={() => handleSelect(t.id)}
                  className="w-full text-left rounded-md border border-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:border-gate-pink hover:bg-gate-pink/5 disabled:opacity-40"
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button onClick={onClose} className="mt-4 w-full rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-400 hover:bg-neutral-800">
          Cancelar
        </button>
      </div>
    </div>
  )
}
