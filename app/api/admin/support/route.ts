import { NextRequest } from 'next/server'
import { apiSuccess } from '@/lib/auth/guard'
import { withPermission } from '@/lib/auth/permissions'
import { listTickets } from '@/lib/support/support'

// ============================================================
// GET /api/admin/support?status=PENDING&page=1
// ============================================================

export const GET = withPermission('suporte.responder', async (request: NextRequest) => {
  const statusParam = request.nextUrl.searchParams.get('status')
  const status = (['PENDING', 'RESOLVED', 'ALL'].includes(statusParam ?? '')
    ? statusParam
    : 'PENDING') as 'PENDING' | 'RESOLVED' | 'ALL'
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)

  const { tickets, totalPages } = await listTickets(status, page)
  return apiSuccess({ tickets, page, totalPages })
})
