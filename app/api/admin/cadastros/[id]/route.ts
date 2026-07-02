import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { withPermission } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

const patchSchema = z.object({
  action: z.enum(['approve', 'block', 'unblock']),
})

// ============================================================
// PATCH /api/admin/cadastros/[id]
// action: 'approve'  — ativa o cadastro
// action: 'block'    — bloqueia o usuário (não exclui; impede novo cadastro
//                       com o mesmo email/usuário/whatsapp)
// action: 'unblock'  — desfaz o bloqueio (ex: clique acidental)
// ============================================================

export const PATCH = withPermission('usuarios.bloquear', async (req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = { action: 'approve' } // compatibilidade com chamadas sem body
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return apiError('Ação inválida', 400, 'INVALID_ACTION')

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return apiError('Cadastro não encontrado', 404, 'NOT_FOUND')

  const data =
    parsed.data.action === 'approve'
      ? { active: true }
      : parsed.data.action === 'block'
        ? { blocked: true, blockedAt: new Date() }
        : { blocked: false, blockedAt: null }

  const updated = await prisma.user.update({ where: { id }, data })

  return apiSuccess({
    user: {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      active: updated.active,
      blocked: updated.blocked,
    },
  })
})

// ============================================================
// DELETE /api/admin/cadastros/[id] — exclui o cadastro de vez
//
// Diferente de 'block': remove o usuário do banco (libera email/usuário
// para um novo cadastro). Útil para testes. Não exclui contas ADMIN.
// Desvincula (sem apagar) o perfil de artista e as faixas enviadas.
// ============================================================

export const DELETE = withRole('ADMIN', async (_req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, email: true } })
  if (!user) return apiError('Cadastro não encontrado', 404, 'NOT_FOUND')
  if (user.role === 'ADMIN') return apiError('Não é possível excluir uma conta admin', 403, 'CANNOT_DELETE_ADMIN')

  await prisma.$transaction([
    // Vínculos obrigatórios — precisam ser removidos antes do usuário
    prisma.adminSession.deleteMany({ where: { userId: id } }),
    prisma.auditLog.deleteMany({ where: { userId: id } }),
    // Vínculos opcionais — desvincula sem apagar o conteúdo
    prisma.artist.updateMany({ where: { userId: id }, data: { userId: null } }),
    prisma.track.updateMany({ where: { submittedById: id }, data: { submittedById: null } }),
    // Libera o email por completo: remove também o pedido na lista de espera
    prisma.waitlist.deleteMany({ where: { email: user.email } }),
    // Por fim, remove o usuário
    prisma.user.delete({ where: { id } }),
  ])

  return apiSuccess({ ok: true })
})
