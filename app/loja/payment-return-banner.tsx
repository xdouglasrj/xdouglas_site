'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Status = 'idle' | 'checking' | 'paid' | 'pending' | 'error'

// Lê os query params que a InfinitePay anexa no redirect de volta (PIX ou
// cartão) e confirma o pagamento pra dar feedback imediato. A liberação
// real do +1GB já é garantida pelo webhook — isso aqui é só UX.
export function PaymentReturnBanner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('idle')

  const orderNsu = searchParams.get('order_nsu')
  const transactionNsu = searchParams.get('transaction_nsu')
  const slug = searchParams.get('slug')

  useEffect(() => {
    if (!orderNsu || !transactionNsu || !slug) return

    setStatus('checking')
    fetch('/api/store/storage/checkout/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNsu, transactionNsu, slug }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error)
        setStatus(data.paid || data.alreadyProcessed ? 'paid' : 'pending')
      })
      .catch(() => setStatus('error'))
      .finally(() => {
        router.replace('/loja')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNsu, transactionNsu, slug])

  if (status === 'idle' || !orderNsu) return null

  return (
    <div
      className={
        'rounded-lg border p-3 text-sm mb-4 ' +
        (status === 'paid'
          ? 'border-green-500/40 bg-green-500/10 text-green-300'
          : status === 'error' || status === 'pending'
            ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300'
            : 'border-white/20 bg-white/5 text-white/70')
      }
    >
      {status === 'checking' && 'Confirmando seu pagamento...'}
      {status === 'paid' && 'Pagamento confirmado! Seu +1GB já está liberado.'}
      {(status === 'pending' || status === 'error') &&
        'Recebemos seu pagamento e estamos confirmando — o +1GB é liberado automaticamente em poucos minutos.'}
    </div>
  )
}
