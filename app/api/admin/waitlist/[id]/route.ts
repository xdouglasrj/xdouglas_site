import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

// ============================================================
// PATCH /api/admin/waitlist/[id] — aceitar convite (marca invitedAt)
// ============================================================

export const PATCH = withRole('ADMIN', async (_req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const entry = await prisma.waitlist.findUnique({ where: { id } })
  if (!entry) return apiError('Pedido não encontrado', 404, 'NOT_FOUND')

  const updated = await prisma.waitlist.update({
    where: { id },
    data: { invitedAt: new Date() },
  })

  return apiSuccess({ entry: updated })
})

// ============================================================
// DELETE /api/admin/waitlist/[id] — rejeitar / remover pedido
// ============================================================

export const DELETE = withRole('ADMIN', async (_req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const entry = await prisma.waitlist.findUnique({ where: { id } })
  if (!entry) return apiError('Pedido não encontrado', 404, 'NOT_FOUND')

  await prisma.waitlist.delete({ where: { id } })

  return apiSuccess({ ok: true })
})
