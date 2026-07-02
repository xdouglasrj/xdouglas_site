import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { isFeatureEnabled } from '@/lib/settings/feature-flags'
import { addTrackComment, listTrackComments, getTrackOwner, TRACK_COMMENT_MAX_LENGTH } from '@/lib/social/track-comments'

const PRIVILEGED_ROLES = ['ADMIN', 'MODERATOR']

// ============================================================
// GET /api/social/tracks/[id]/comments — lista comentários
// ============================================================

export const GET = withAuth(async (_request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const [comments, owner] = await Promise.all([
    listTrackComments(trackId, { userId: auth.userId, role: auth.role }),
    getTrackOwner(trackId),
  ])

  const isPrivileged = PRIVILEGED_ROLES.includes(auth.role)
  const isOwner = !!owner?.ownerId && owner.ownerId === auth.userId
  const allowComments = isPrivileged || isOwner || (owner?.allowComentariosNaMusica ?? true)

  return apiSuccess({ comments, allowComments })
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

  if (!(await isFeatureEnabled('comentar_musica'))) {
    return apiError('Comentários em músicas estão desativados no momento', 403, 'FEATURE_DISABLED')
  }

  const owner = await getTrackOwner(trackId)
  const isPrivileged = PRIVILEGED_ROLES.includes(auth.role)
  const isOwner = !!owner?.ownerId && owner.ownerId === auth.userId
  if (!isPrivileged && !isOwner && owner && !owner.allowComentariosNaMusica) {
    return apiError('O artista desativou novos comentários nesta música', 403, 'COMMENTS_DISABLED')
  }

  const comment = await addTrackComment(trackId, auth.userId, parsed.data.content)
  return apiSuccess({ comment }, 201)
})
