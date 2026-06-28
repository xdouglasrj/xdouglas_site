import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { confirmStoragePayment } from '@/lib/payments/storage-checkout-service'
import { InfinitePayError } from '@/lib/payments/infinitepay'

const webhookSchema = z.object({
  order_nsu: z.string(),
  transaction_nsu: z.string(),
  invoice_slug: z.string(),
})

// POST /api/webhooks/infinitepay — rota pública (sem auth, fora dos
// prefixos protegidos pelo middleware). O payload em si não é confiável
// por si só: confirmStoragePayment sempre reverifica via payment_check
// antes de liberar qualquer efeito.
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Body inválido' }, { status: 400 })
  }

  const parsed = webhookSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Payload inválido' }, { status: 400 })
  }

  try {
    await confirmStoragePayment({
      orderNsu: parsed.data.order_nsu,
      transactionNsu: parsed.data.transaction_nsu,
      invoiceSlug: parsed.data.invoice_slug,
    })
    return NextResponse.json({ success: true, message: null })
  } catch (err) {
    if (err instanceof InfinitePayError) {
      console.error('[InfinitePay] Webhook — pedido inválido', err.message)
      // 200 pra não entrar em retry infinito num pedido que nunca vai existir
      return NextResponse.json({ success: false, message: err.message })
    }
    console.error('[InfinitePay] Webhook — erro interno', err)
    // InfinitePay reenvia em caso de erro != 400 — deixa retry acontecer
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}
