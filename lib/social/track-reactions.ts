import { prisma } from '@/lib/prisma'
import { REACTION_EMOJIS, type ReactionEmoji } from '@/lib/reactions'

// ============================================================
// V3 Plano 15 — reações com emoji nas faixas. Camada expressiva
// ADICIONAL ao TrackLike: NÃO vale ponto, NÃO influencia trending,
// e NÃO gera notificação (anti-spam). 1 reação por usuário por
// faixa — trocar de emoji substitui a anterior (@@unique).
// ============================================================

export interface ReactionSummaryItem {
  emoji: ReactionEmoji
  count: number
}

/** Reação atual do usuário na faixa (null se não reagiu). */
export async function getUserReaction(trackId: string, userId: string): Promise<ReactionEmoji | null> {
  const reaction = await prisma.trackReaction.findUnique({
    where: { trackId_userId: { trackId, userId } },
  })
  return (reaction?.emoji as ReactionEmoji | undefined) ?? null
}

/** Distribuição de reações por emoji, na ordem fixa de REACTION_EMOJIS. */
export async function getReactionSummary(trackId: string): Promise<ReactionSummaryItem[]> {
  const grouped = await prisma.trackReaction.groupBy({
    by: ['emoji'],
    where: { trackId },
    _count: { emoji: true },
  })
  const countByEmoji = new Map(grouped.map((g) => [g.emoji, g._count.emoji]))
  return REACTION_EMOJIS.map((emoji) => ({ emoji, count: countByEmoji.get(emoji) ?? 0 }))
}

/** Reage com um emoji do conjunto fixo — trocar substitui a reação anterior. */
export async function setTrackReaction(
  trackId: string,
  userId: string,
  emoji: ReactionEmoji
): Promise<ReactionSummaryItem[]> {
  await prisma.trackReaction.upsert({
    where: { trackId_userId: { trackId, userId } },
    create: { trackId, userId, emoji },
    update: { emoji },
  })
  return getReactionSummary(trackId)
}

/** Remove a reação do usuário na faixa (idempotente). */
export async function removeTrackReaction(trackId: string, userId: string): Promise<ReactionSummaryItem[]> {
  await prisma.trackReaction.deleteMany({ where: { trackId, userId } })
  return getReactionSummary(trackId)
}
