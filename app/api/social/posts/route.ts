import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { isFeatureEnabled } from '@/lib/settings/feature-flags'
import { createPost, listFeed } from '@/lib/social/feed'

// ============================================================
// GET /api/social/posts?page=1 — feed paginado
// ============================================================

export const GET = withAuth(async (request: NextRequest, auth) => {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const { posts, totalPages } = await listFeed(auth.userId, page)
  return apiSuccess({ posts, page, totalPages })
})

// ============================================================
// POST /api/social/posts — cria um post no feed
// ============================================================

const bodySchema = z.object({
  content: z.string().trim().min(1, 'Escreva algo para publicar').max(500),
})

export const POST = withAuth(async (request: NextRequest, auth) => {
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

  if (!(await isFeatureEnabled('postar_feed'))) {
    return apiError('Publicar no feed está desativado no momento', 403, 'FEATURE_DISABLED')
  }

  const post = await createPost(auth.userId, parsed.data.content)
  return apiSuccess({ post }, 201)
})
