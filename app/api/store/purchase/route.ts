import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { purchaseItem, StoreError } from '@/lib/store/purchase-service'
import { InsufficientPointsError } from '@/lib/points/points-service'

const bodySchema = z.object({
  itemKey: z.enum([
    'PRIORITY_INVITE',
    'PIN_TRACK_COMMENT',
    'FEATURE_TRACK',
    'EXTRA_STORAGE',
    'MAPPING_ACCESS',
    'APP_PREMIUM',
    'PIN_FEED_POST',
  ]),
  referEmail: z.string().email().optional(),
})

// POST /api/store/purchase — compra um item do catálogo com pontos
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

  try {
    const purchase = await purchaseItem(auth.userId, parsed.data.itemKey, { referEmail: parsed.data.referEmail })
    return apiSuccess({ purchase })
  } catch (err) {
    if (err instanceof InsufficientPointsError) {
      return apiError(err.message, 400, 'INSUFFICIENT_POINTS')
    }
    if (err instanceof StoreError) {
      return apiError(err.message, 400, err.code)
    }
    console.error('[Store] Falha na compra', err)
    return apiError('Erro interno', 500, 'INTERNAL_ERROR')
  }
})
