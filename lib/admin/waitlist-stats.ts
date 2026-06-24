import { prisma } from '@/lib/prisma'

export const WAITLIST_BREAKDOWN_TIPOS = ['DJ', 'PRODUTOR', 'ARTISTA', 'MUSICO', 'OUVINTE'] as const

export interface WaitlistStats {
  total: number
  pending: number
  countByTipo: Record<string, number>
}

/** Contagem global da waitlist — usada no contador exibido nas páginas de convites/cadastros. */
export async function getWaitlistStats(): Promise<WaitlistStats> {
  const [total, pending, breakdown] = await Promise.all([
    prisma.waitlist.count(),
    prisma.waitlist.count({ where: { invitedAt: null } }),
    prisma.waitlist.groupBy({
      by: ['tipoUsuario'],
      _count: { _all: true },
    }),
  ])

  const countByTipo = Object.fromEntries(
    breakdown.map((b) => [b.tipoUsuario, b._count._all])
  )

  return { total, pending, countByTipo }
}
