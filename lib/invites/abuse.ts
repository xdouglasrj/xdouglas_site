import { prisma } from '@/lib/prisma'
import { spendPoints } from '@/lib/points/points-service'

const SETTINGS_ID = 'singleton'

// Pontos da indicação confirmada (espelha FRIEND_INVITE_COMPLETED em
// lib/points/constants.ts) — usado pra cancelar só os pontos daquela
// indicação específica no nível 1 da punição
const FRIEND_INVITE_COMPLETED_POINTS = 300

export interface AbuseResult {
  newLevel: number
  blockedUntil: Date | null
  accountSuspended: boolean
}

/**
 * Marca uma entrada da waitlist como indicação abusiva — escala 3 níveis,
 * critérios (dias de bloqueio) editáveis em AppSettings, não fixos aqui.
 * Chamado manualmente pelo admin em /admin/convites.
 */
export async function flagInviteAbuse(waitlistId: string): Promise<AbuseResult> {
  const entry = await prisma.waitlist.findUnique({ where: { id: waitlistId } })
  if (!entry?.referredByUserId) {
    throw new Error('Essa entrada não tem indicador vinculado')
  }

  const referrer = await prisma.user.findUniqueOrThrow({ where: { id: entry.referredByUserId } })
  const nextLevel = referrer.inviteAbuseLevel + 1

  if (nextLevel === 1) {
    // Cancela só os pontos daquela indicação específica — não afeta o resto do saldo
    await spendPoints(
      referrer.id,
      FRIEND_INVITE_COMPLETED_POINTS,
      'INVITE_ABUSE_PENALTY',
      `Indicação suspeita cancelada: ${entry.email}`
    ).catch(() => {
      // Saldo já foi gasto em outra coisa — segue com a penalidade mesmo sem debitar
    })

    await prisma.user.update({ where: { id: referrer.id }, data: { inviteAbuseLevel: 1 } })
    return { newLevel: 1, blockedUntil: null, accountSuspended: false }
  }

  if (nextLevel === 2) {
    const settings = await prisma.appSettings.findUnique({ where: { id: SETTINGS_ID } })
    const days = settings?.inviteAbuseBlockDays ?? 30
    const blockedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: referrer.id },
      data: { inviteAbuseLevel: 2, inviteBlockedUntil: blockedUntil },
    })
    return { newLevel: 2, blockedUntil, accountSuspended: false }
  }

  // Nível 3+ — abuso grave/reincidência: suspende a conta
  await prisma.user.update({
    where: { id: referrer.id },
    data: { inviteAbuseLevel: 3, blocked: true, blockedAt: new Date() },
  })
  return { newLevel: 3, blockedUntil: null, accountSuspended: true }
}
