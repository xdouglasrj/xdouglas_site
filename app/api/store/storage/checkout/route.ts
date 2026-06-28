import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { createStorageCheckout } from '@/lib/payments/storage-checkout-service'
import { InfinitePayError } from '@/lib/payments/infinitepay'

// POST /api/store/storage/checkout — gera o link de pagamento InfinitePay
// (PIX ou cartão) pro +1GB pago em dinheiro real
export const POST = withAuth(async (_request, auth) => {
  try {
    const { url } = await createStorageCheckout(auth.userId)
    return apiSuccess({ url })
  } catch (err) {
    if (err instanceof InfinitePayError) {
      console.error('[InfinitePay] Falha ao criar checkout', err)
      return apiError('Não foi possível iniciar o pagamento agora, tente novamente', 502, 'INFINITEPAY_ERROR')
    }
    console.error('[InfinitePay] Erro interno', err)
    return apiError('Erro interno', 500, 'INTERNAL_ERROR')
  }
})
