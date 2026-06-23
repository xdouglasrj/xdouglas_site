import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
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

export const PATCH = withRole('ADMIN', async (req: NextRequest, _auth, params) => {
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
