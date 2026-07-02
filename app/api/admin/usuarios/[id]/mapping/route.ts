import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, apiError } from '@/lib/auth/guard'
import { withPermission } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

// ============================================================
// PATCH /api/admin/usuarios/[id]/mapping
// Libera/revoga manualmente o acesso à dashboard de estatísticas
// por faixa (/minhas-musicas) — base de um plano pago futuro,
// hoje liberado usuário a usuário pelo admin.
// ============================================================

const bodySchema = z.object({
  enabled: z.boolean(),
})

export const PATCH = withPermission('usuarios.editar', async (request: NextRequest, _auth, params) => {
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
      data: { mappingEnabled: parsed.data.enabled },
      select: { id: true, mappingEnabled: true },
    })
    return apiSuccess({ user })
  } catch {
    return apiError('Usuário não encontrado', 404, 'NOT_FOUND')
  }
})
