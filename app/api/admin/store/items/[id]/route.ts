import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

const bodySchema = z.object({
  price: z.number().int().positive().optional(),
  active: z.boolean().optional(),
})

// PATCH /api/admin/store/items/[id] — ajuste manual de preço/ativação.
// Reajustes automáticos do mercado dinâmico continuam funcionando por
// cima do valor que o admin definir aqui.
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
  if (Object.keys(parsed.data).length === 0) return apiError('Nada para atualizar', 400, 'EMPTY_UPDATE')

  const item = await prisma.storeItem.update({ where: { id }, data: parsed.data })
  return apiSuccess({ item })
})
