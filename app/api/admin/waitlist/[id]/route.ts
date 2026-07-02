import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/auth/guard'
import { withPermission } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { acceptWaitlistEntry } from '@/lib/invites/accept'

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

export const PATCH = withPermission('convites.gerenciar', async (req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const entry = await prisma.waitlist.findUnique({ where: { id } })
  if (!entry) return apiError('Pedido não encontrado', 404, 'NOT_FOUND')

  const result = await acceptWaitlistEntry(entry, resolveBaseUrl(req))

  return apiSuccess(result)
})

// ============================================================
// DELETE /api/admin/waitlist/[id] — rejeitar / remover pedido
// ============================================================

export const DELETE = withPermission('convites.gerenciar', async (_req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const entry = await prisma.waitlist.findUnique({ where: { id } })
  if (!entry) return apiError('Pedido não encontrado', 404, 'NOT_FOUND')

  await prisma.waitlist.delete({ where: { id } })

  return apiSuccess({ ok: true })
})
