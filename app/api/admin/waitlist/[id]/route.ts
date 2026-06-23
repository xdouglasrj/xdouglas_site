import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import {
  generateInviteCode,
  inviteTargetForCategory,
  buildRegistrationUrl,
} from '@/lib/invites/code'

// ============================================================
// Base URL pública (para montar o link do convite)
// ============================================================

function resolveBaseUrl(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL
  if (fromEnv) return fromEnv
  // Fallback: origem da própria requisição
  return req.nextUrl.origin
}

// ============================================================
// PATCH /api/admin/waitlist/[id] — aceitar convite
//
// Gera uma chave aleatória, marca o pedido como convidado e devolve
// o link de cadastro da página correspondente à categoria escolhida.
// Idempotente: se já foi aceito, devolve a mesma chave/link.
// ============================================================

export const PATCH = withRole('ADMIN', async (req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const entry = await prisma.waitlist.findUnique({ where: { id } })
  if (!entry) return apiError('Pedido não encontrado', 404, 'NOT_FOUND')

  const target = inviteTargetForCategory(entry.tipoUsuario)

  // Reaproveita a chave se o convite já foi aceito (re-enviar o link)
  let inviteCode = entry.inviteCode
  if (!entry.invitedAt || !inviteCode) {
    inviteCode = generateInviteCode()
    await prisma.waitlist.update({
      where: { id },
      data: { invitedAt: new Date(), inviteCode },
    })
  }

  const registrationUrl = buildRegistrationUrl(resolveBaseUrl(req), target, inviteCode)

  return apiSuccess({
    inviteCode,
    registrationUrl,
    category: entry.tipoUsuario,
    accountType: target.type,
    email: entry.email,
  })
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
