import { NextRequest } from 'next/server'
import { withRole, apiSuccess } from '@/lib/auth/guard'
import { listReports } from '@/lib/reports/reports'

// ============================================================
// GET /api/admin/reports?status=PENDING&page=1
// ============================================================

export const GET = withRole('ADMIN', async (request: NextRequest) => {
  const statusParam = request.nextUrl.searchParams.get('status')
  const status = (['PENDING', 'RESOLVED', 'DISMISSED', 'ALL'].includes(statusParam ?? '')
    ? statusParam
    : 'PENDING') as 'PENDING' | 'RESOLVED' | 'DISMISSED' | 'ALL'
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)

  const { reports, totalPages } = await listReports(status, page)
  return apiSuccess({ reports, page, totalPages })
})
