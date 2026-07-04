import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { isFeatureEnabled } from '@/lib/settings/feature-flags'
import { toggleTrackCommentLike } from '@/lib/social/track-comments'

// ============================================================
// POST   /api/social/comments/[commentId]/like — curte
// DELETE /api/social/comments/[commentId]/like — descurte
// (V3 Plano 2 — like em comentário de música)
// ============================================================

export const POST = withAuth(async (_request: NextRequest, auth, params) => {
  const commentId = params?.commentId
  if (!commentId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  if (!(await isFeatureEnabled('curtir'))) {
    return apiError('Curtidas estão desativadas no momento', 403, 'FEATURE_DISABLED')
  }

  const result = await toggleTrackCommentLike(commentId, auth.userId, true)
  if (!result) return apiError('Comentário não encontrado', 404, 'NOT_FOUND')

  return apiSuccess(result)
})

export const DELETE = withAuth(async (_request: NextRequest, auth, params) => {
  const commentId = params?.commentId
  if (!commentId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const result = await toggleTrackCommentLike(commentId, auth.userId, false)
  if (!result) return apiError('Comentário não encontrado', 404, 'NOT_FOUND')

  return apiSuccess(result)
})
