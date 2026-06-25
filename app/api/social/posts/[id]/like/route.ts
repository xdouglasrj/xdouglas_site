import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { toggleLike } from '@/lib/social/feed'

// ============================================================
// POST /api/social/posts/[id]/like — liga/desliga curtida
// ============================================================

export const POST = withAuth(async (_request: NextRequest, auth, params) => {
  const postId = params?.id
  if (!postId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  try {
    const liked = await toggleLike(postId, auth.userId)
    return apiSuccess({ liked })
  } catch {
    return apiError('Erro ao curtir', 500, 'LIKE_ERROR')
  }
})
