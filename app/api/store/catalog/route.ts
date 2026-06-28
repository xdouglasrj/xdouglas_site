import { withAuth, apiSuccess } from '@/lib/auth/guard'
import { getCatalogForUser } from '@/lib/store/purchase-service'

// GET /api/store/catalog — itens visíveis pro usuário logado + saldo gastável
export const GET = withAuth(async (_request, auth) => {
  const data = await getCatalogForUser(auth.userId)
  return apiSuccess(data)
})
