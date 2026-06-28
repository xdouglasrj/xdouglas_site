import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { useStorePurchase, StoreError } from '@/lib/store/purchase-service'

const bodySchema = z.object({ targetId: z.string().min(1) })

// POST /api/store/purchases/[id]/use — escolhe o alvo (faixa/comentário/post)
// pro item AWAITING_USE comprado
export const POST = withAuth(async (request, auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return apiError('targetId obrigatório', 400, 'VALIDATION_ERROR')

  try {
    const purchase = await useStorePurchase(id, auth.userId, parsed.data.targetId)
    return apiSuccess({ purchase })
  } catch (err) {
    if (err instanceof StoreError) return apiError(err.message, 400, err.code)
    console.error('[Store] Falha ao usar item', err)
    return apiError('Erro interno', 500, 'INTERNAL_ERROR')
  }
})
