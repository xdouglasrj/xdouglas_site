import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'

// ============================================================
// GET /api/admin/auth/me
// Valida token no banco (dupla camada) e retorna dados do usuário
// ============================================================

export const GET = withAuth(async (_request: NextRequest, auth) => {
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  })

  if (!user || !user.active) {
    return apiError('Usuário não encontrado ou inativo', 404, 'USER_NOT_FOUND')
  }

  return apiSuccess({ user })
})
