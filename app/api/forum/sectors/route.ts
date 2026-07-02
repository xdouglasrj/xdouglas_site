import { withAuth, apiSuccess } from '@/lib/auth/guard'
import { listActiveSectors } from '@/lib/forum/forum'

// ============================================================
// GET /api/forum/sectors — lista setores ativos (entrada do fórum)
// ============================================================

export const GET = withAuth(async () => {
  const sectors = await listActiveSectors()
  return apiSuccess({ sectors })
})
