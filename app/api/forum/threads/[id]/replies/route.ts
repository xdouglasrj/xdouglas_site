import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { addReply } from '@/lib/forum/forum'

// ============================================================
// POST /api/forum/threads/[id]/replies — responde um tópico
// ============================================================

const bodySchema = z.object({
  body: z.string().trim().min(1, 'Escreva uma resposta').max(5000),
})

export const POST = withAuth(async (request: NextRequest, auth, params) => {
  const threadId = params?.id
  if (!threadId) return apiError('ID obrigatório', 400, 'MISSING_ID')

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

  const reply = await addReply(threadId, auth.userId, parsed.data.body)
  return apiSuccess({ reply }, 201)
})
