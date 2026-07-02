import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { updateSector, deleteSector } from '@/lib/forum/forum'

// ============================================================
// PUT /api/admin/forum/sectors/[id] — atualiza/reordena/ativa setor
// DELETE /api/admin/forum/sectors/[id] — remove setor
// ============================================================

const updateSchema = z.object({
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  order: z.number().int().min(0).optional(),
  onlyAdminPost: z.boolean().optional(),
  active: z.boolean().optional(),
})

export const PUT = withRole('ADMIN', async (request: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')

  try {
    const sector = await updateSector(id, parsed.data)
    return apiSuccess({ sector })
  } catch {
    return apiError('Erro ao atualizar setor', 500, 'UPDATE_ERROR')
  }
})

export const DELETE = withRole('ADMIN', async (_request: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  try {
    await deleteSector(id)
    return apiSuccess({ ok: true })
  } catch {
    return apiError('Não é possível remover um setor que já tem tópicos', 409, 'DELETE_ERROR')
  }
})
