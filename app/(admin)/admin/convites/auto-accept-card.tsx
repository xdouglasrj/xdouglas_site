'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AutoAcceptCardProps {
  initialEnabled: boolean
  initialRemaining: number
}

export function AutoAcceptCard({ initialEnabled, initialRemaining }: AutoAcceptCardProps) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [remaining, setRemaining] = useState(initialRemaining)
  const [limit, setLimit] = useState(initialRemaining > 0 ? initialRemaining : 1000)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function apply(nextEnabled: boolean) {
    if (busy) return
    setError(null)

    if (nextEnabled && (!limit || limit < 1)) {
      setError('Defina um limite de pelo menos 1 convite.')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/admin/settings/auto-accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled, limit }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError('Não foi possível salvar.')
        return
      }
      setEnabled(data.enabled)
      setRemaining(data.remaining)
      router.refresh()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Aceite automático</h2>
            <span
              className={[
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border',
                enabled
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700',
              ].join(' ')}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
              {enabled ? 'Ligado' : 'Desligado'}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 max-w-md">
            Quando ligado, os próximos pedidos de convite são aceitos sozinhos (chave + email enviados na hora).
            Ao atingir o limite, desliga automaticamente e volta ao aceite manual.
          </p>
        </div>

        {/* Botão liga/desliga */}
        <button
          type="button"
          onClick={() => apply(!enabled)}
          disabled={busy}
          role="switch"
          aria-checked={enabled}
          aria-label="Ligar/desligar aceite automático"
          className={[
            'relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50',
            enabled ? 'bg-emerald-600' : 'bg-neutral-700',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-1 h-5 w-5 rounded-full bg-white transition-transform',
              enabled ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Contador / limite */}
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
            Limite de convites
          </label>
          <input
            type="number"
            min={1}
            max={100000}
            value={limit}
            disabled={enabled || busy}
            onChange={(e) => setLimit(parseInt(e.target.value, 10) || 0)}
            className="w-32 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none transition focus:border-rose-500 disabled:opacity-50"
          />
        </div>

        {enabled && (
          <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-2">
            <p className="text-[11px] uppercase tracking-wider text-emerald-500/80">Restantes</p>
            <p className="text-lg font-bold tabular-nums text-emerald-300">
              {remaining.toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        {!enabled && (
          <button
            type="button"
            onClick={() => apply(true)}
            disabled={busy}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
          >
            {busy ? 'Ligando…' : 'Ligar piloto automático'}
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      {enabled && (
        <p className="mt-3 text-xs text-neutral-500">
          Para mudar o limite, desligue, ajuste e ligue de novo.
        </p>
      )}
    </div>
  )
}
