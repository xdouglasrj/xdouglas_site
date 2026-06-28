'use client'

import { useState } from 'react'
import { EXTRA_STORAGE_PRICE_CENTS } from '@/lib/payments/storage-product'

const priceLabel = (EXTRA_STORAGE_PRICE_CENTS / 100).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

// Oferta de +1GB pago em dinheiro real (não em pontos) — separado do item
// "Armazenamento extra" da loja de pontos. Pagamento único via InfinitePay
// (PIX ou cartão); o usuário é redirecionado pro checkout deles.
export function StorageSubscriptionCard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBuy() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/store/storage/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao iniciar pagamento')
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao iniciar pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gate-pink/40 bg-gate-pink/5 p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-white">+1GB de armazenamento</p>
        <p className="text-xs text-white/50 mt-0.5">
          Pra quem precisa de mais espaço pra publicar música. Pagamento único, via PIX ou cartão.
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-bold text-gate-pink">{priceLabel}</p>
        <button
          onClick={handleBuy}
          disabled={loading}
          className="mt-1 rounded-md border border-gate-pink px-3 py-1.5 text-xs font-semibold text-gate-pink hover:bg-gate-pink/10 disabled:opacity-50"
        >
          {loading ? 'Abrindo pagamento...' : 'Comprar'}
        </button>
      </div>
    </div>
  )
}
