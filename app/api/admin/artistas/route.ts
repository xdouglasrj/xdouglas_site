import { withAuth, apiSuccess } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

// GET /api/admin/artistas — lista artistas para o select do formulário
export const GET = withAuth(async () => {
  const artists = await prisma.artist.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  })
  return apiSuccess({ artists })
})
