import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { addComment, listComments, listAllComments, CommentRateLimitError } from '@/lib/social/feed'

// ============================================================
// GET /api/social/posts/[id]/comments — lista comentários
// (10 mais recentes; envia o total para a página "ver todos")
// ?all=1 pagina os comentários (usado na página de comentários),
// aceitando ?limit= (20/50/100) e ?offset=
// ============================================================

const ALLOWED_PAGE_LIMITS = [20, 50, 100]

export const GET = withAuth(async (request: NextRequest, _auth, params) => {
  const postId = params?.id
  if (!postId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  if (request.nextUrl.searchParams.get('all')) {
    const limitParam = Number(request.nextUrl.searchParams.get('limit'))
    const limit = ALLOWED_PAGE_LIMITS.includes(limitParam) ? limitParam : 20
    const offset = Math.max(0, Number(request.nextUrl.searchParams.get('offset')) || 0)
    const { comments, total } = await listAllComments(postId, limit, offset)
    return apiSuccess({ comments, total })
  }

  const { comments, total } = await listComments(postId)
  return apiSuccess({ comments, total })
})

// ============================================================
// POST /api/social/posts/[id]/comments — adiciona comentário
// Limite: 1 comentário por usuário a cada 48h (em qualquer post)
// ============================================================

const bodySchema = z.object({
  content: z.string().trim().min(1, 'Escreva um comentário').max(500),
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

  try {
    const comment = await addComment(postId, auth.userId, parsed.data.content)
    return apiSuccess({ comment }, 201)
  } catch (err) {
    if (err instanceof CommentRateLimitError) {
      return NextResponse.json(
        { error: 'Você só pode comentar uma vez a cada 48 horas', code: 'RATE_LIMITED', retryAt: err.retryAt.toISOString() },
        { status: 429 }
      )
    }
    throw err
  }
})
