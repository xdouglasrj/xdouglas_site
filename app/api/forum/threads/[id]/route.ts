import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { getThread, setThreadLocked } from '@/lib/forum/forum'

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

// ============================================================
// PATCH /api/forum/threads/[id] — bloquear/desbloquear (admin)
// ============================================================

const patchSchema = z.object({ locked: z.boolean() })

export const PATCH = withRole('ADMIN', async (request: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')

  const thread = await setThreadLocked(id, parsed.data.locked)
  return apiSuccess({ thread })
})
