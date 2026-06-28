import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { deletePost, getPost, togglePostPin } from '@/lib/social/feed'

// ============================================================
// GET /api/social/posts/[id] — busca um post
// ============================================================

export const GET = withAuth(async (_request: NextRequest, _auth, params) => {
  const postId = params?.id
  if (!postId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const post = await getPost(postId)
  if (!post) return apiError('Publicação não encontrada', 404, 'NOT_FOUND')

  return apiSuccess({ post })
})

// ============================================================
// PATCH /api/social/posts/[id] — fixa/desafixa no topo do feed
// (só admin)
// ============================================================

const patchSchema = z.object({ pinned: z.boolean() })

export const PATCH = withAuth(async (request: NextRequest, auth, params) => {
  const postId = params?.id
  if (!postId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  if (auth.role !== 'ADMIN') {
    return apiError('Apenas administradores podem fixar publicações', 403, 'FORBIDDEN')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const post = await togglePostPin(postId, parsed.data.pinned)
  return apiSuccess({ post })
})

// ============================================================
// DELETE /api/social/posts/[id] — exclui um post
// (autor do post ou admin)
// ============================================================

export const DELETE = withAuth(async (_request: NextRequest, auth, params) => {
  const postId = params?.id
  if (!postId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const ok = await deletePost(postId, auth.userId, auth.role === 'ADMIN')
  if (!ok) return apiError('Você só pode excluir suas próprias publicações', 403, 'FORBIDDEN')

  return apiSuccess({ ok: true })
})
