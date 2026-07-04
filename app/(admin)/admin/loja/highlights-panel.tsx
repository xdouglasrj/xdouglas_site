'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// V3 Plano 13 — moderação dos destaques pagos: lista ativos/históricos e
// permite cancelar com estorno de pontos ao dono. O estorno é atômico no
// servidor (highlight-service.cancelHighlightWithRefund).

export interface AdminHighlightRow {
  id: string
  trackTitle: string
  userLabel: string
  costPoints: number
  startsAt: string
  endsAt: string
  canceledAt: string | null
  isActive: boolean
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function HighlightsPanel({ highlights }: { highlights: AdminHighlightRow[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)

  async function cancel(id: string) {
    if (busyId) return
    if (!confirm('Cancelar este destaque e estornar os pontos ao dono?')) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/highlights/${id}/cancel`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        router.refresh()
      } else {
        alert(data?.error ?? 'Falha ao cancelar')
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section>
      <h2 className="text-base font-semibold text-white mb-1">Destaques pagos</h2>
      <p className="text-sm text-neutral-500 mb-4">
        Faixas destacadas com pontos (V3 Plano 13). Cancelar estorna os pontos ao dono.
      </p>

      {highlights.length === 0 ? (
        <p className="text-sm text-neutral-500">Nenhum destaque registrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-neutral-400">
                <th className="px-3 py-2 font-medium">Faixa</th>
                <th className="px-3 py-2 font-medium">Quem pagou</th>
                <th className="px-3 py-2 font-medium">Custo</th>
                <th className="px-3 py-2 font-medium">Período</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {highlights.map((h) => (
                <tr key={h.id} className="border-b border-neutral-900 text-neutral-200">
                  <td className="px-3 py-2">{h.trackTitle}</td>
                  <td className="px-3 py-2">{h.userLabel}</td>
                  <td className="px-3 py-2 tabular-nums">{h.costPoints.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2 text-xs text-neutral-400">
                    {fmt(h.startsAt)} → {fmt(h.endsAt)}
                  </td>
                  <td className="px-3 py-2">
                    {h.canceledAt ? (
                      <span className="text-neutral-500">Cancelado</span>
                    ) : h.isActive ? (
                      <span className="text-emerald-400">Ativo</span>
                    ) : (
                      <span className="text-neutral-500">Expirado</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {h.isActive && !h.canceledAt ? (
                      <button
                        onClick={() => cancel(h.id)}
                        disabled={busyId === h.id}
                        className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                      >
                        {busyId === h.id ? '...' : 'Cancelar + estornar'}
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
