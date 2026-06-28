import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { togglePostCommentPin } from '@/lib/social/feed'

// ============================================================
// PATCH /api/social/comments/[commentId] — fixa/desafixa
// (só admin pode chamar)
// ============================================================

const bodySchema = z.object({ pinned: z.boolean() })

export const PATCH = withAuth(async (request: NextRequest, auth, params) => {
  const commentId = params?.commentId
  if (!commentId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  if (auth.role !== 'ADMIN') {
    return apiError('Apenas administradores podem fixar comentários', 403, 'FORBIDDEN')
  }

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

  const comment = await togglePostCommentPin(commentId, parsed.data.pinned)
  return apiSuccess({ comment })
})
