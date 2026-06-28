'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StoreItem, StorePurchase } from '@prisma/client'
import { UseItemModal } from './use-item-modal'

type PurchaseWithItem = StorePurchase & { storeItem: { key: string; label: string } }

const STATUS_LABEL: Record<string, string> = {
  AWAITING_USE: 'Aguardando você usar',
  ACTIVE: 'Ativo',
  USED: 'Usado',
  EXPIRED: 'Expirado',
  REFUNDED: 'Reembolsado',
}

export function StoreCatalog({
  items,
  myPurchases,
  spendableBalance,
}: {
  items: StoreItem[]
  myPurchases: PurchaseWithItem[]
  spendableBalance: number
}) {
  const router = useRouter()
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [usingPurchase, setUsingPurchase] = useState<PurchaseWithItem | null>(null)

  async function handleBuy(item: StoreItem) {
    let referEmail: string | undefined
    if (item.key === 'PRIORITY_INVITE') {
      referEmail = window.prompt('Email da pessoa que você quer indicar:') ?? undefined
      if (!referEmail) return
    }

    if (!confirm(`Comprar "${item.label}" por ${item.price.toLocaleString('pt-BR')} pontos?`)) return

    setBusyKey(item.key)
    try {
      const res = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey: item.key, referEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        router.refresh()
      } else {
        alert(data.error ?? 'Erro ao comprar')
      }
    } finally {
      setBusyKey(null)
    }
  }

  const awaitingUse = myPurchases.filter((p) => p.status === 'AWAITING_USE')

  return (
    <div className="mt-6 space-y-6">
      {awaitingUse.length > 0 && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
            Itens esperando você usar
          </h2>
          <ul className="space-y-2">
            {awaitingUse.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-white/80">
                  {p.storeItem.label}
                  {p.usableUntil && (
                    <span className="text-white/40 text-xs ml-2">
                      use até {new Date(p.usableUntil).toLocaleString('pt-BR')}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setUsingPurchase(p)}
                  className="rounded-md bg-gate-pink px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Usar agora
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-gate-azure bg-white/5 divide-y divide-gate-azure/40">
        {items.map((item) => {
          const canAfford = spendableBalance >= item.price
          return (
            <div key={item.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {item.price.toLocaleString('pt-BR')} pontos
                  {item.durationHours && ` · dura ${item.durationHours >= 24 ? `${item.durationHours / 24} dia(s)` : `${item.durationHours}h`}`}
                  {item.maxPurchasesPerUser && ` · até ${item.maxPurchasesPerUser}x`}
                </p>
              </div>
              <button
                onClick={() => handleBuy(item)}
                disabled={!canAfford || busyKey === item.key}
                className="shrink-0 rounded-md bg-gate-pink px-3 py-2 text-xs font-semibold text-white disabled:opacity-30"
              >
                {busyKey === item.key ? 'Comprando...' : canAfford ? 'Comprar' : 'Pontos insuficientes'}
              </button>
            </div>
          )
        })}
      </div>

      {myPurchases.length > 0 && (
        <details className="text-xs text-white/40">
          <summary className="cursor-pointer">Histórico de compras</summary>
          <ul className="mt-2 space-y-1">
            {myPurchases.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.storeItem.label}</span>
                <span>{STATUS_LABEL[p.status] ?? p.status} · {new Date(p.purchasedAt).toLocaleDateString('pt-BR')}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {usingPurchase && (
        <UseItemModal
          purchase={usingPurchase}
          onClose={() => setUsingPurchase(null)}
          onUsed={() => {
            setUsingPurchase(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
