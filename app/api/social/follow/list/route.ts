import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { listFollowers, listFollowing } from '@/lib/social/follow'

// ============================================================
// GET /api/social/follow/list?userId=&type=followers|following&q=
// Lista pública de quem segue / é seguido por um usuário — usada
// nos popups de "seguidores"/"seguindo" do perfil.
// ============================================================

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl
  const userId = searchParams.get('userId')
  const type = searchParams.get('type')
  const q = searchParams.get('q') ?? undefined

  if (!userId || (type !== 'followers' && type !== 'following')) {
    return apiError('Parâmetros inválidos', 400, 'VALIDATION_ERROR')
  }

  const users = type === 'followers' ? await listFollowers(userId, { q }) : await listFollowing(userId, { q })

  return apiSuccess({ users })
})
