const API_BASE = 'https://api.checkout.infinitepay.io'

interface CheckoutItem {
  quantity: number
  price: number // centavos
  description: string
}

interface CreateCheckoutLinkParams {
  orderNsu: string
  items: CheckoutItem[]
  redirectUrl: string
  webhookUrl: string
}

export class InfinitePayError extends Error {}

function getHandle(): string {
  const handle = process.env.INFINITEPAY_HANDLE
  if (!handle) throw new InfinitePayError('INFINITEPAY_HANDLE não configurado')
  return handle
}

// Cria o link de checkout (PIX ou cartão) — não exige API key, a conta é
// identificada pelo handle público (@ da InfinitePay). Confirmação real do
// pagamento sempre passa por webhook + checkPayment, nunca pelo redirect.
export async function createCheckoutLink({
  orderNsu,
  items,
  redirectUrl,
  webhookUrl,
}: CreateCheckoutLinkParams): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle: getHandle(),
      redirect_url: redirectUrl,
      webhook_url: webhookUrl,
      order_nsu: orderNsu,
      items,
    }),
  })

  if (!res.ok) {
    throw new InfinitePayError(`Falha ao criar link de checkout (${res.status})`)
  }

  const data = await res.json()
  if (!data?.url) throw new InfinitePayError('Resposta sem url de checkout')
  return { url: data.url as string }
}

interface CheckPaymentParams {
  orderNsu: string
  transactionNsu: string
  slug: string
}

interface CheckPaymentResult {
  success: boolean
  paid: boolean
  amount: number
  paidAmount: number
  installments: number
  captureMethod: string
}

// Verificação server-to-server — usada tanto pelo webhook quanto pela
// página de retorno, pra nunca confiar só no payload recebido do cliente.
export async function checkPayment({
  orderNsu,
  transactionNsu,
  slug,
}: CheckPaymentParams): Promise<CheckPaymentResult> {
  const res = await fetch(`${API_BASE}/payment_check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle: getHandle(),
      order_nsu: orderNsu,
      transaction_nsu: transactionNsu,
      slug,
    }),
  })

  if (!res.ok) {
    throw new InfinitePayError(`Falha ao verificar pagamento (${res.status})`)
  }

  const data = await res.json()
  return {
    success: Boolean(data?.success),
    paid: Boolean(data?.paid),
    amount: Number(data?.amount ?? 0),
    paidAmount: Number(data?.paid_amount ?? 0),
    installments: Number(data?.installments ?? 1),
    captureMethod: String(data?.capture_method ?? ''),
  }
}
