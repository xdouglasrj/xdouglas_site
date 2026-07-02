import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, type AuthContext } from './guard'
import { hasPermission, type PermissionId } from '@/lib/permissions/catalog'

export { hasPermission }

// ============================================================
// withPermission — variante de withRole que checa uma permissão
// granular em vez de role mínima. Sempre busca `permissions` do
// banco (nunca do JWT) para que um rebaixamento tenha efeito
// imediato, sem esperar o token expirar.
// ============================================================

type ApiHandler = (
  request: NextRequest,
  auth: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>

export function withPermission(permissionId: PermissionId, handler: ApiHandler) {
  return withAuth(async (request, auth, params) => {
    if (auth.role === 'ADMIN') {
      return handler(request, auth, params)
    }

    if (auth.role !== 'MODERATOR') {
      return NextResponse.json(
        { error: 'Acesso negado', code: 'INSUFFICIENT_ROLE' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { permissions: true },
    })

    if (!user || !user.permissions.includes(permissionId)) {
      return NextResponse.json(
        { error: 'Acesso negado', code: 'INSUFFICIENT_PERMISSION' },
        { status: 403 }
      )
    }

    return handler(request, auth, params)
  })
}
