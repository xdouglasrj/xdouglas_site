import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

const bodySchema = z.object({ active: z.boolean() })

// PATCH /api/admin/store/promotions/[id] — liga/desliga uma promoção
export const PATCH = withRole('ADMIN', async (request, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')

  const promotion = await prisma.pointsPromotion.update({ where: { id }, data: { active: parsed.data.active } })
  return apiSuccess({ promotion })
})
