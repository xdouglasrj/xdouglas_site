import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { addComment, listComments } from '@/lib/social/feed'

// ============================================================
// GET /api/social/posts/[id]/comments — lista comentários
// ============================================================

export const GET = withAuth(async (_request: NextRequest, _auth, params) => {
  const postId = params?.id
  if (!postId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const comments = await listComments(postId)
  return apiSuccess({ comments })
})

// ============================================================
// POST /api/social/posts/[id]/comments — adiciona comentário
// ============================================================

const bodySchema = z.object({
  content: z.string().trim().min(1, 'Escreva um comentário').max(1000),
})

export const POST = withAuth(async (request: NextRequest, auth, params) => {
  const postId = params?.id
  if (!postId) return apiError('ID obrigatório', 400, 'MISSING_ID')

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

  const comment = await addComment(postId, auth.userId, parsed.data.content)
  return apiSuccess({ comment }, 201)
})
