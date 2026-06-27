import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { resolveTicket } from '@/lib/support/support'
import { prisma } from '@/lib/prisma'

// ============================================================
// PATCH /api/admin/support/[id] — marca o chamado como resolvido
// ============================================================

export const PATCH = withRole('ADMIN', async (_req, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const ticket = await prisma.supportTicket.findUnique({ where: { id } })
  if (!ticket) return apiError('Chamado não encontrado', 404, 'NOT_FOUND')

  const updated = await resolveTicket(id)
  return apiSuccess({ ticket: updated })
})
