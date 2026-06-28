import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import { giftPoints } from '@/lib/points/points-service'
import { giftItem, StoreError } from '@/lib/store/purchase-service'

const bodySchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('points'), email: z.string().email(), amount: z.number().int().positive(), description: z.string().min(1).max(200) }),
  z.object({
    mode: z.literal('item'),
    email: z.string().email(),
    itemKey: z.enum(['PRIORITY_INVITE', 'PIN_TRACK_COMMENT', 'FEATURE_TRACK', 'EXTRA_STORAGE', 'MAPPING_ACCESS', 'APP_PREMIUM', 'PIN_FEED_POST']),
    referEmail: z.string().email().optional(),
  }),
])

// POST /api/admin/store/gift — presente do admin: pontos brutos OU item
// já pronto pra usar, pulando cobrança/limite de venda
export const POST = withRole('ADMIN', async (request, auth) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')

  const target = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } })
  if (!target) return apiError('Usuário não encontrado', 404, 'USER_NOT_FOUND')

  try {
    if (parsed.data.mode === 'points') {
      const result = await giftPoints(target.id, parsed.data.amount, parsed.data.description)
      return apiSuccess({ result })
    }

    const purchase = await giftItem(auth.userId, target.id, parsed.data.itemKey, { referEmail: parsed.data.referEmail })
    return apiSuccess({ purchase })
  } catch (err) {
    if (err instanceof StoreError) return apiError(err.message, 400, err.code)
    console.error('[Store] Falha ao presentear', err)
    return apiError('Erro interno', 500, 'INTERNAL_ERROR')
  }
})
