'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// V3 Plano 13 — botão "Destacar por Xh (Y pontos)" na própria faixa.
// Débito é feito no servidor (atômico); aqui só disparamos e mostramos
// confirmação/erro. Um clique = uma requisição: o botão trava enquanto a
// chamada está em andamento (busy), evitando dois débitos pelo mesmo clique.

interface HighlightInfo {
  costPoints: number
  durationHours: number
  spendableBalance: number
  canAfford: boolean
  alreadyActive: boolean
  activeCountForUser: number
  maxActivePerUser: number
}

export function HighlightButton({ trackId }: { trackId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<HighlightInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openModal() {
    setOpen(true)
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/tracks/${trackId}/highlight`)
      const data = await res.json()
      if (res.ok) setInfo(data.info)
      else setError(data.error ?? 'Não foi possível carregar as informações')
    } catch {
      setError('Falha de conexão')
    } finally {
      setLoading(false)
    }
  }

  async function confirm() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/tracks/${trackId}/highlight`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setOpen(false)
        router.refresh()
      } else {
        setError(data.error ?? 'Não foi possível destacar a faixa')
        // Recarrega o estado (saldo/limites) para refletir a falha
        openModal()
      }
    } catch {
      setError('Falha de conexão')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gate-azure px-3 py-1.5 text-xs font-semibold text-white transition hover:border-gate-pink hover:text-gate-pink"
      >
        ⭐ Destacar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl border border-gate-azure bg-neutral-900 p-6">
            <h2 className="text-base font-semibold text-white mb-1">Destacar faixa</h2>

            {loading || !info ? (
              <p className="text-sm text-gate-blue">{error ?? 'Carregando...'}</p>
            ) : (
              <>
                <p className="text-sm text-gate-blue mb-4">
                  Sua faixa aparece na home e na página do gênero, com selo{' '}
                  <span className="text-gate-pink font-medium">Em destaque</span>, por{' '}
                  {info.durationHours}h.
                </p>

                <dl className="mb-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gate-blue">Custo</dt>
                    <dd className="font-semibold text-white">
                      {info.costPoints.toLocaleString('pt-BR')} pontos
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gate-blue">Seu saldo</dt>
                    <dd className="font-semibold text-white">
                      {info.spendableBalance.toLocaleString('pt-BR')} pontos
                    </dd>
                  </div>
                </dl>

                {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

                {info.alreadyActive ? (
                  <p className="mb-3 text-xs text-amber-400">Esta faixa já está em destaque agora.</p>
                ) : info.activeCountForUser >= info.maxActivePerUser ? (
                  <p className="mb-3 text-xs text-amber-400">
                    Você já tem {info.maxActivePerUser} faixas em destaque ao mesmo tempo.
                  </p>
                ) : !info.canAfford ? (
                  <p className="mb-3 text-xs text-amber-400">
                    Saldo insuficiente.{' '}
                    <a href="/ganhe-pontos" className="text-gate-pink underline">
                      Ganhe pontos
                    </a>
                  </p>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={
                      busy || !info.canAfford || info.alreadyActive || info.activeCountForUser >= info.maxActivePerUser
                    }
                    className="flex-1 rounded-lg bg-gate-pink px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? 'Destacando...' : 'Confirmar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-gate-azure px-3 py-2 text-xs text-gate-blue hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
