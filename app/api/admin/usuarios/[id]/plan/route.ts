import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

// ============================================================
// PATCH /api/admin/usuarios/[id]/plan
// Troca manual do plano (FREE/PAID) — hoje o pagamento é via Pix
// conferido manualmente pelo admin, sem gateway automático.
// ============================================================

const bodySchema = z.object({
  plan: z.enum(['FREE', 'PAID']),
})

export const PATCH = withRole('ADMIN', async (request: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

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
    const user = await prisma.user.update({
      where: { id },
      data: { plan: parsed.data.plan },
      select: { id: true, plan: true },
    })
    return apiSuccess({ user })
  } catch {
    return apiError('Usuário não encontrado', 404, 'NOT_FOUND')
  }
})
