import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { listFollowers, listFollowing, getFollowingSet } from '@/lib/social/follow'

// ============================================================
// GET /api/social/follow/list?userId=&type=followers|following&q=
// Lista pública de quem segue / é seguido por um usuário — usada
// nos popups de "seguidores"/"seguindo" do perfil.
// ============================================================

const PAGE_SIZE = 30

export const GET = withAuth(async (request: NextRequest, auth) => {
  const { searchParams } = request.nextUrl
  const userId = searchParams.get('userId')
  const type = searchParams.get('type')
  const q = searchParams.get('q') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  if (!userId || (type !== 'followers' && type !== 'following')) {
    return apiError('Parâmetros inválidos', 400, 'VALIDATION_ERROR')
  }

  const opts = { q, limit: PAGE_SIZE + 1, skip: (page - 1) * PAGE_SIZE }
  const rows = type === 'followers' ? await listFollowers(userId, opts) : await listFollowing(userId, opts)

  const hasMore = rows.length > PAGE_SIZE
  const users = rows.slice(0, PAGE_SIZE)
  const followingSet = await getFollowingSet(auth.userId, users.map((u) => u.id))
  const usersWithFollowState = users.map((u) => ({ ...u, isFollowing: u.id === auth.userId ? null : followingSet.has(u.id) }))

  return apiSuccess({ users: usersWithFollowState, hasMore, page })
})
