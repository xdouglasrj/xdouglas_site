'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AD_SLOTS } from '@/lib/ads/config'

interface AdsSettingsCardProps {
  initialEnabled: boolean
  initialSlots: Record<string, string>
  slotDefinitions: typeof AD_SLOTS
}

export function AdsSettingsCard({ initialEnabled, initialSlots, slotDefinitions }: AdsSettingsCardProps) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [slots, setSlots] = useState(initialSlots)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(next: { enabled: boolean; slots: Record<string, string> }) {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/settings/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      const data = await res.json()
      if (!res.ok) {
        setError('Não foi possível salvar.')
        return
      }
      setEnabled(data.enabled)
      setSlots(data.slots)
      setSaved(true)
      router.refresh()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  function toggleEnabled() {
    if (busy) return
    save({ enabled: !enabled, slots })
  }

  function updateSlotId(key: string, value: string) {
    setSlots((prev) => ({ ...prev, [key]: value }))
  }

  function saveSlots() {
    save({ enabled, slots })
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Anúncios ativos</h2>
          <p className="mt-1 text-xs text-neutral-500 max-w-sm">
            Com isso desligado, nenhum script de ads carrega para ninguém — independente do
            consentimento individual de cada usuário.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleEnabled}
          disabled={busy}
          role="switch"
          aria-checked={enabled}
          className={[
            'relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50',
            enabled ? 'bg-rose-600' : 'bg-neutral-700',
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

      <div className="mt-5 border-t border-neutral-800 pt-5">
        <h3 className="text-sm font-semibold text-white">IDs de slot por posição</h3>
        <p className="mt-1 text-xs text-neutral-500">
          ID do slot no provedor (ex: AdSense data-ad-slot). Deixe vazio para não exibir
          anúncio naquela posição, mesmo com ads ativo.
        </p>

        <div className="mt-4 space-y-3">
          {Object.entries(slotDefinitions).map(([key, def]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-neutral-300">{def.label}</label>
              <p className="text-[11px] text-neutral-500">{def.description}</p>
              <input
                type="text"
                value={slots[key] ?? ''}
                onChange={(e) => updateSlotId(key, e.target.value)}
                placeholder="ex: 1234567890"
                className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-rose-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={saveSlots}
          disabled={busy}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-50"
        >
          Salvar slots
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      {saved && !error && <p className="mt-3 text-xs text-emerald-400">Salvo.</p>}
    </div>
  )
}
