import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { createContest, contestInputSchema, listAllContestsForAdmin } from '@/lib/contests/contests'

// ============================================================
// GET /api/admin/contests — todos os contests (qualquer status)
// ============================================================

export const GET = withRole('ADMIN', async () => {
  const contests = await listAllContestsForAdmin()
  return apiSuccess({ contests })
})

// ============================================================
// POST /api/admin/contests — admin cria um novo concurso
// ============================================================

export const POST = withRole('ADMIN', async (request: NextRequest) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = contestInputSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const contest = await createContest(parsed.data)
  return apiSuccess({ contest }, 201)
})
