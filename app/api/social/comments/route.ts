import { NextRequest } from 'next/server'
import { withAuth, apiSuccess } from '@/lib/auth/guard'
import { listGlobalComments } from '@/lib/social/feed'

// ============================================================
// GET /api/social/comments — comentários de todos os posts,
// mais recentes primeiro. Paginado com ?limit= (20/50/100) e ?offset=.
// Usado na página "Comentários" do sidebar.
// ============================================================

const ALLOWED_PAGE_LIMITS = [20, 50, 100]

export const GET = withAuth(async (request: NextRequest) => {
  const limitParam = Number(request.nextUrl.searchParams.get('limit'))
  const limit = ALLOWED_PAGE_LIMITS.includes(limitParam) ? limitParam : 20
  const offset = Math.max(0, Number(request.nextUrl.searchParams.get('offset')) || 0)

  const { comments, total } = await listGlobalComments(limit, offset)
  return apiSuccess({ comments, total })
})
