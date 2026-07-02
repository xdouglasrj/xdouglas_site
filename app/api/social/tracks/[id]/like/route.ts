import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { isFeatureEnabled } from '@/lib/settings/feature-flags'
import { isTrackLiked, toggleTrackLike } from '@/lib/social/track-likes'

// ============================================================
// GET /api/social/tracks/[id]/like — estado atual da curtida
// POST /api/social/tracks/[id]/like — liga/desliga curtida
// ============================================================

export const GET = withAuth(async (_request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const liked = await isTrackLiked(trackId, auth.userId)
  return apiSuccess({ liked })
})

export const POST = withAuth(async (_request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  if (!(await isFeatureEnabled('curtir'))) {
    return apiError('Curtidas estão desativadas no momento', 403, 'FEATURE_DISABLED')
  }

  try {
    const liked = await toggleTrackLike(trackId, auth.userId)
    return apiSuccess({ liked })
  } catch {
    return apiError('Erro ao curtir', 500, 'LIKE_ERROR')
  }
})
