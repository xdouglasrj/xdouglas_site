import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError, getRequestIpHash } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import { isValidPermissionId, LOCKED_PERMISSION_IDS } from '@/lib/permissions/catalog'

// ============================================================
// PATCH /api/admin/usuarios/[id]/permissions
//
// Só ADMIN pode chamar (é o próprio item trancado 'permissoes.gerenciar').
// Valida que todo id enviado existe no catálogo e que nenhum id do
// grupo "Administração" (trancado) foi incluído, mesmo que a request
// tenha sido forjada. Promove o usuário a MODERATOR ao atribuir a
// primeira permissão; rebaixa de volta a MEMBER se a lista ficar vazia.
// Nunca altera uma conta que já é ADMIN.
// ============================================================

const bodySchema = z.object({
  permissions: z.array(z.string()),
})

export const PATCH = withRole('ADMIN', async (request: NextRequest, auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const requested = parsed.data.permissions

  for (const permissionId of requested) {
    if (!isValidPermissionId(permissionId)) {
      return apiError(`Permissão desconhecida: ${permissionId}`, 400, 'UNKNOWN_PERMISSION')
    }
    if ((LOCKED_PERMISSION_IDS as string[]).includes(permissionId)) {
      return apiError('Permissões do grupo Administração são exclusivas do ADMIN', 403, 'LOCKED_PERMISSION')
    }
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, permissions: true } })
  if (!target) return apiError('Usuário não encontrado', 404, 'NOT_FOUND')
  if (target.role === 'ADMIN') return apiError('Não é possível atribuir permissões a uma conta ADMIN', 403, 'CANNOT_EDIT_ADMIN')

  const newRole = requested.length > 0 ? 'MODERATOR' : target.role === 'MODERATOR' ? 'MEMBER' : target.role

  const updated = await prisma.user.update({
    where: { id },
    data: { permissions: requested, role: newRole },
    select: { id: true, role: true, permissions: true },
  })

  await prisma.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'PERMISSIONS_UPDATE',
      entityId: id,
      entityType: 'User',
      metadata: { before: target.permissions, after: requested, roleBefore: target.role, roleAfter: updated.role },
      ipHash: await getRequestIpHash(request),
    },
  })

  return apiSuccess({ user: updated })
})
