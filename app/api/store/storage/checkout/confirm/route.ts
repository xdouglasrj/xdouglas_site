import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import { confirmStoragePayment } from '@/lib/payments/storage-checkout-service'
import { InfinitePayError } from '@/lib/payments/infinitepay'

const bodySchema = z.object({
  orderNsu: z.string(),
  transactionNsu: z.string(),
  slug: z.string(),
})

// POST /api/store/storage/checkout/confirm — chamada pela página de
// retorno (depois do redirect da InfinitePay) pra dar feedback imediato ao
// usuário. Não é a fonte de verdade do pagamento — isso é o webhook — mas
// usa a mesma trava de corrida, então é seguro chamar os dois.
export const POST = withAuth(async (request, auth) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const order = await prisma.paymentOrder.findUnique({ where: { orderNsu: parsed.data.orderNsu } })
  if (!order || order.userId !== auth.userId) {
    return apiError('Pedido não encontrado', 404, 'NOT_FOUND')
  }

  try {
    const result = await confirmStoragePayment({
      orderNsu: parsed.data.orderNsu,
      transactionNsu: parsed.data.transactionNsu,
      invoiceSlug: parsed.data.slug,
    })
    return apiSuccess(result)
  } catch (err) {
    if (err instanceof InfinitePayError) {
      return apiError(err.message, 502, 'INFINITEPAY_ERROR')
    }
    console.error('[InfinitePay] Falha ao confirmar pagamento', err)
    return apiError('Erro interno', 500, 'INTERNAL_ERROR')
  }
})
