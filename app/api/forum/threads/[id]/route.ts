import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { getThread } from '@/lib/forum/forum'

// ============================================================
// GET /api/forum/threads/[id] — tópico + respostas
// ============================================================

export const GET = withAuth(async (_request: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const thread = await getThread(id)
  if (!thread) return apiError('Tópico não encontrado', 404, 'NOT_FOUND')

  return apiSuccess({ thread })
})
