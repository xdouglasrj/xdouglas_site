import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { addTrackComment, listTrackComments, TRACK_COMMENT_MAX_LENGTH } from '@/lib/social/track-comments'

// ============================================================
// GET /api/social/tracks/[id]/comments — lista comentários
// ============================================================

export const GET = withAuth(async (_request: NextRequest, _auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const comments = await listTrackComments(trackId)
  return apiSuccess({ comments })
})

// ============================================================
// POST /api/social/tracks/[id]/comments — adiciona comentário
// ============================================================

const bodySchema = z.object({
  content: z.string().trim().min(1, 'Escreva um comentário').max(TRACK_COMMENT_MAX_LENGTH, `Máximo de ${TRACK_COMMENT_MAX_LENGTH} caracteres`),
})

export const POST = withAuth(async (request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

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

  const comment = await addTrackComment(trackId, auth.userId, parsed.data.content)
  return apiSuccess({ comment }, 201)
})
