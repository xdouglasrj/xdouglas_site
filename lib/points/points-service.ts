import { Prisma, PointActionType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { POINT_RULES, LOGIN_STREAK_BONUS_EVERY_DAYS, LOGIN_STREAK_GRACE_HOURS } from './constants'
import { getLevelForXp } from './levels'
import { getActivePromotionMultiplier } from './promotions'
import { checkDynamicPricing } from '@/lib/store/dynamic-pricing'

type Tx = Prisma.TransactionClient

export interface AddPointsResult {
  awarded: number // 0 se bateu teto/once e não pontuou
  totalXp: number
  level: number
  leveledUp: boolean
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Núcleo de toda movimentação de XP. Nunca altera User.totalXp fora desta
 * função — totalXp é o XP vitalício (só cresce, define o nível); o saldo
 * gastável na loja é calculado separadamente em getSpendableBalance(),
 * somando todo o PointsHistory (positivos e negativos).
 */
export async function addPoints(
  userId: string,
  action: PointActionType,
  opts?: { points?: number; description?: string }
): Promise<AddPointsResult> {
  return prisma.$transaction((tx) => applyEarnedPoints(tx, userId, action, opts))
}

async function applyEarnedPoints(
  tx: Tx,
  userId: string,
  action: PointActionType,
  opts?: { points?: number; description?: string }
): Promise<AddPointsResult> {
  const rule = POINT_RULES[action]
  const basePoints = opts?.points ?? rule.points

  const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })

  if (rule.once) {
    const already = await tx.pointsHistory.findFirst({ where: { userId, action } })
    if (already) {
      return { awarded: 0, totalXp: user.totalXp, level: user.level, leveledUp: false }
    }
  }

  if (rule.dailyOccurrenceCap) {
    const since = startOfDay(new Date())
    const countToday = await tx.pointsHistory.count({
      where: { userId, action, createdAt: { gte: since } },
    })
    if (countToday >= rule.dailyOccurrenceCap) {
      return { awarded: 0, totalXp: user.totalXp, level: user.level, leveledUp: false }
    }
  }

  const multiplier = await getActivePromotionMultiplier(tx)
  const finalPoints = Math.round(basePoints * multiplier)

  await tx.pointsHistory.create({
    data: { userId, action, points: finalPoints, description: opts?.description },
  })

  const newTotalXp = user.totalXp + finalPoints
  const newLevel = getLevelForXp(newTotalXp)

  await tx.user.update({ where: { id: userId }, data: { totalXp: newTotalXp, level: newLevel } })

  await checkDynamicPricing(tx, userId, user.role, newTotalXp)

  return {
    awarded: finalPoints,
    totalXp: newTotalXp,
    level: newLevel,
    leveledUp: newLevel > user.level,
  }
}

export interface DailyLoginResult {
  awarded: boolean // false = já tinha logado hoje, não pontuou de novo
  streak: number
  streakBonusAwarded: boolean
}

/**
 * Login diário com sequência. Idempotente no mesmo dia — chamar de novo
 * no mesmo dia não pontua nem altera a sequência.
 */
export async function registerDailyLogin(userId: string): Promise<DailyLoginResult> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    const now = new Date()
    const last = user.lastDailyLoginAt

    if (last && startOfDay(last).getTime() === startOfDay(now).getTime()) {
      return { awarded: false, streak: user.loginStreak, streakBonusAwarded: false }
    }

    const hoursSinceLast = last ? (now.getTime() - last.getTime()) / 3_600_000 : Infinity
    const brokeStreak = hoursSinceLast > LOGIN_STREAK_GRACE_HOURS
    const newStreak = brokeStreak ? 1 : user.loginStreak + 1

    await tx.user.update({
      where: { id: userId },
      data: { lastDailyLoginAt: now, loginStreak: newStreak },
    })

    await applyEarnedPoints(tx, userId, 'DAILY_LOGIN')

    const streakBonusAwarded = newStreak % LOGIN_STREAK_BONUS_EVERY_DAYS === 0
    if (streakBonusAwarded) {
      await applyEarnedPoints(tx, userId, 'DAILY_LOGIN_STREAK_BONUS')
    }

    return { awarded: true, streak: newStreak, streakBonusAwarded }
  })
}

/** Saldo gastável na loja — soma todo o histórico (ganhos - gastos/penalidades). */
export async function getSpendableBalance(userId: string): Promise<number> {
  const result = await prisma.pointsHistory.aggregate({
    where: { userId },
    _sum: { points: true },
  })
  return result._sum.points ?? 0
}

export class InsufficientPointsError extends Error {
  constructor() {
    super('Saldo de pontos insuficiente')
  }
}

/**
 * Debita pontos do saldo gastável (loja, penalidade) — NUNCA toca em
 * totalXp/level, que são o histórico de conquista, não o saldo.
 */
export async function spendPoints(
  userId: string,
  amount: number,
  action: Extract<PointActionType, 'STORE_REDEMPTION' | 'INVITE_ABUSE_PENALTY' | 'ADMIN_ADJUSTMENT'>,
  description?: string
): Promise<{ remainingBalance: number }> {
  if (amount <= 0) throw new Error('amount precisa ser positivo')

  return prisma.$transaction(async (tx) => {
    const balance = await tx.pointsHistory.aggregate({
      where: { userId },
      _sum: { points: true },
    })
    const current = balance._sum.points ?? 0

    if (current < amount) {
      throw new InsufficientPointsError()
    }

    await tx.pointsHistory.create({
      data: { userId, action, points: -amount, description },
    })

    return { remainingBalance: current - amount }
  })
}

/** Presente direto do admin — pula a validação de saldo, sempre soma. */
export async function giftPoints(userId: string, amount: number, description: string): Promise<AddPointsResult> {
  return addPoints(userId, 'ADMIN_GIFT', { points: amount, description })
}
