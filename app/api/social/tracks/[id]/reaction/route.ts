import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { isReactionEmoji } from '@/lib/reactions'
import {
  getUserReaction,
  getReactionSummary,
  setTrackReaction,
  removeTrackReaction,
} from '@/lib/social/track-reactions'

// ============================================================
// GET    /api/social/tracks/[id]/reaction — reação atual do usuário + distribuição
// PUT    /api/social/tracks/[id]/reaction — reage com um emoji do conjunto fixo
//                                            (trocar substitui a anterior)
// DELETE /api/social/tracks/[id]/reaction — remove a reação
//
// V3 Plano 15 — camada expressiva ADICIONAL ao TrackLike: não vale ponto,
// não influencia trending, sem notificação (anti-spam).
// ============================================================

export const GET = withAuth(async (_request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const [myReaction, summary] = await Promise.all([
    getUserReaction(trackId, auth.userId),
    getReactionSummary(trackId),
  ])
  return apiSuccess({ myReaction, summary })
})

export const PUT = withAuth(async (request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Corpo inválido', 400, 'INVALID_BODY')
  }

  const emoji = (body as { emoji?: unknown })?.emoji
  if (typeof emoji !== 'string' || !isReactionEmoji(emoji)) {
    return apiError('Emoji inválido', 400, 'INVALID_EMOJI')
  }

  try {
    const summary = await setTrackReaction(trackId, auth.userId, emoji)
    return apiSuccess({ myReaction: emoji, summary })
  } catch {
    return apiError('Erro ao reagir', 500, 'REACTION_ERROR')
  }
})

export const DELETE = withAuth(async (_request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  try {
    const summary = await removeTrackReaction(trackId, auth.userId)
    return apiSuccess({ myReaction: null, summary })
  } catch {
    return apiError('Erro ao remover reação', 500, 'REACTION_ERROR')
  }
})
