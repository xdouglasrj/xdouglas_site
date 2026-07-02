import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { updateTrackComment, deleteTrackComment, toggleTrackCommentPin, TRACK_COMMENT_MAX_LENGTH } from '@/lib/social/track-comments'

// ============================================================
// PATCH /api/social/tracks/[id]/comments/[commentId]
// - { content } edita (só o autor do comentário pode editar)
// - { pinned } fixa/desafixa (só admin)
// ============================================================

const bodySchema = z.union([
  z.object({
    content: z.string().trim().min(1, 'Escreva um comentário').max(TRACK_COMMENT_MAX_LENGTH, `Máximo de ${TRACK_COMMENT_MAX_LENGTH} caracteres`),
  }),
  z.object({ pinned: z.boolean() }),
])

export const PATCH = withAuth(async (request: NextRequest, auth, params) => {
  const commentId = params?.commentId
  if (!commentId) return apiError('ID obrigatório', 400, 'MISSING_ID')

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

  if ('pinned' in parsed.data) {
    if (auth.role !== 'ADMIN') return apiError('Apenas administradores podem fixar comentários', 403, 'FORBIDDEN')
    const comment = await toggleTrackCommentPin(commentId, parsed.data.pinned)
    return apiSuccess({ comment })
  }

  const comment = await updateTrackComment(commentId, auth.userId, parsed.data.content)
  if (!comment) return apiError('Você só pode editar seus próprios comentários', 403, 'FORBIDDEN')

  return apiSuccess({ comment })
})

// ============================================================
// DELETE /api/social/tracks/[id]/comments/[commentId] — exclui
// (autor do comentário ou admin)
// ============================================================

export const DELETE = withAuth(async (_request: NextRequest, auth, params) => {
  const commentId = params?.commentId
  if (!commentId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const ok = await deleteTrackComment(commentId, auth.userId, auth.role === 'ADMIN' || auth.role === 'MODERATOR')
  if (!ok) return apiError('Você só pode excluir seus próprios comentários', 403, 'FORBIDDEN')

  return apiSuccess({ ok: true })
})
