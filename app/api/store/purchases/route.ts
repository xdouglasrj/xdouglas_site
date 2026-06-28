import { withAuth, apiSuccess } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

// GET /api/store/purchases — minhas compras (mais recentes primeiro)
export const GET = withAuth(async (_request, auth) => {
  const purchases = await prisma.storePurchase.findMany({
    where: { userId: auth.userId },
    include: { storeItem: { select: { key: true, label: true } } },
    orderBy: { purchasedAt: 'desc' },
    take: 50,
  })
  return apiSuccess({ purchases })
})
