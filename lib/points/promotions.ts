import { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type Db = PrismaClient | Prisma.TransactionClient

/**
 * Multiplicador de XP vigente agora (ex: 2x num dia de promoção). Se mais
 * de uma promoção estiver ativa ao mesmo tempo, usa a maior — não soma.
 * Retorna 1 (sem efeito) se nenhuma promoção estiver valendo.
 */
export async function getActivePromotionMultiplier(db: Db = prisma): Promise<number> {
  const now = new Date()
  const weekday = now.getDay() // 0=domingo .. 6=sábado

  const promotions = await db.pointsPromotion.findMany({ where: { active: true } })

  let multiplier = 1

  for (const p of promotions) {
    const matchesWeekday = p.weekday !== null && p.weekday === weekday
    const matchesDateRange =
      p.weekday === null &&
      (!p.startAt || p.startAt <= now) &&
      (!p.endAt || p.endAt >= now)

    if (matchesWeekday || matchesDateRange) {
      multiplier = Math.max(multiplier, p.multiplier)
    }
  }

  return multiplier
}
