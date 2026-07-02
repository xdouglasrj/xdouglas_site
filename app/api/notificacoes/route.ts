import { NextRequest } from 'next/server'
import { withAuth, apiSuccess } from '@/lib/auth/guard'
import { listNotifications } from '@/lib/notifications/notifications'

// ============================================================
// GET /api/notificacoes?page=1&filter=all|unread — lista notificações do usuário logado
// ============================================================

export const GET = withAuth(async (request: NextRequest, auth) => {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const filter = request.nextUrl.searchParams.get('filter') === 'unread' ? 'unread' : 'all'

  const { notifications, totalPages } = await listNotifications(auth.userId, { page, filter })
  return apiSuccess({ notifications, page, totalPages })
})
