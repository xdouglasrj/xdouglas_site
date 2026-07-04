import { NextRequest } from 'next/server'
import { withAuth, apiSuccess } from '@/lib/auth/guard'
import { getRecentHistory, clearHistory } from '@/lib/social/listening-history'

// ============================================================
// GET /api/social/history — últimas faixas ouvidas (privado, V3 Plano 17)
// DELETE /api/social/history — "limpar histórico"
// ============================================================

export const GET = withAuth(async (_request: NextRequest, auth) => {
  const entries = await getRecentHistory(auth.userId)
  return apiSuccess({ entries })
})

export const DELETE = withAuth(async (_request: NextRequest, auth) => {
  const count = await clearHistory(auth.userId)
  return apiSuccess({ ok: true, deleted: count })
})
