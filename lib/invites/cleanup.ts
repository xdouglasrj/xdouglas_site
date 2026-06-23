import { prisma } from '@/lib/prisma'

// Convites aceitos expiram se o cadastro não for concluído em 7 dias.
export const INVITE_EXPIRY_DAYS = 7

export function inviteExpiryCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Remove convites aceitos (invitedAt preenchido) cujo cadastro nunca foi
 * concluído (usedAt nulo) e que já passaram do prazo de 7 dias.
 * Libera o email para um novo pedido.
 */
export async function cleanupExpiredInvites(now: Date = new Date()): Promise<{
  deleted: number
  ranAt: string
}> {
  const cutoff = inviteExpiryCutoff(now)

  const result = await prisma.waitlist.deleteMany({
    where: {
      usedAt: null,
      invitedAt: { not: null, lt: cutoff },
    },
  })

  return { deleted: result.count, ranAt: now.toISOString() }
}
