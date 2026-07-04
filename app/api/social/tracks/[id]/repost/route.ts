import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { isFeatureEnabled } from '@/lib/settings/feature-flags'
import { isTrackReposted, toggleTrackRepost } from '@/lib/social/track-reposts'

// ============================================================
// GET    /api/social/tracks/[id]/repost — estado atual
// POST   /api/social/tracks/[id]/repost — reposta
// DELETE /api/social/tracks/[id]/repost — desfaz o repost
// (V3 Plano 3)
// ============================================================

export const GET = withAuth(async (_request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const reposted = await isTrackReposted(trackId, auth.userId)
  return apiSuccess({ reposted })
})

async function handleToggle(trackId: string, userId: string) {
  const result = await toggleTrackRepost(trackId, userId)
  if (!result.ok) {
    if (result.reason === 'OWN_TRACK') {
      return apiError('Você não pode repostar a própria música', 400, 'OWN_TRACK')
    }
    return apiError('Música não encontrada', 404, 'NOT_FOUND')
  }
  return apiSuccess({ reposted: result.reposted, repostCount: result.repostCount })
}

export const POST = withAuth(async (_request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  if (!(await isFeatureEnabled('curtir'))) {
    return apiError('Interações estão desativadas no momento', 403, 'FEATURE_DISABLED')
  }

  return handleToggle(trackId, auth.userId)
})

export const DELETE = withAuth(async (_request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  return handleToggle(trackId, auth.userId)
})
