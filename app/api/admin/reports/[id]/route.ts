import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, apiError } from '@/lib/auth/guard'
import { withPermission } from '@/lib/auth/permissions'
import { resolveReport, deleteReportedContent } from '@/lib/reports/reports'
import { prisma } from '@/lib/prisma'

// ============================================================
// PATCH /api/admin/reports/[id]
// action: 'resolve_keep'   — marca como resolvida, mantém o conteúdo
// action: 'resolve_delete' — remove o conteúdo denunciado e resolve
// action: 'dismiss'        — descarta a denúncia (sem mérito)
// ============================================================

const bodySchema = z.object({
  action: z.enum(['resolve_keep', 'resolve_delete', 'dismiss']),
})

export const PATCH = withPermission('denuncias.gerenciar', async (req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return apiError('Ação inválida', 400, 'INVALID_ACTION')

  const report = await prisma.report.findUnique({ where: { id } })
  if (!report) return apiError('Denúncia não encontrada', 404, 'NOT_FOUND')

  if (parsed.data.action === 'resolve_delete') {
    await deleteReportedContent(report.targetType, report.targetId)
  }

  const status = parsed.data.action === 'dismiss' ? 'DISMISSED' : 'RESOLVED'
  const updated = await resolveReport(id, status)

  return apiSuccess({ report: updated })
})
