import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { contestInputSchema, updateContest, deleteContest } from '@/lib/contests/contests'

// ============================================================
// PUT /api/admin/contests/[id] — admin edita/publica um concurso
// ============================================================

const updateSchema = contestInputSchema.partial()

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
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  try {
    const contest = await updateContest(id, parsed.data)
    return apiSuccess({ contest })
  } catch {
    return apiError('Concurso não encontrado', 404, 'NOT_FOUND')
  }
})

// ============================================================
// DELETE /api/admin/contests/[id]
// ============================================================

export const DELETE = withRole('ADMIN', async (_req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  try {
    await deleteContest(id)
    return apiSuccess({ ok: true })
  } catch {
    return apiError('Concurso não encontrado', 404, 'NOT_FOUND')
  }
})
