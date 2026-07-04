import { prisma } from '@/lib/prisma'
import { addPoints } from '@/lib/points/points-service'
import { awardMilestoneOnce } from '@/lib/points/milestones'
import { getTrackOwner } from './track-comments'
import { createNotification } from '@/lib/notifications/notifications'
import { checkAndAwardProfileCompletion } from '@/lib/profile-completeness'

export async function isTrackLiked(trackId: string, userId: string): Promise<boolean> {
  const like = await prisma.trackLike.findUnique({
    where: { trackId_userId: { trackId, userId } },
  })
  return !!like
}

/** Liga/desliga a curtida da música. Retorna o novo estado (true = curtido). */
export async function toggleTrackLike(trackId: string, userId: string): Promise<boolean> {
  const existing = await prisma.trackLike.findUnique({
    where: { trackId_userId: { trackId, userId } },
  })

  if (existing) {
    await prisma.trackLike.delete({ where: { id: existing.id } })
    return false
  }

  await prisma.trackLike.create({ data: { trackId, userId } })

  // Gamificação — teto diário de ocorrências já é aplicado dentro do
  // PointsService; não bloqueia a curtida se falhar
  addPoints(userId, 'TRACK_LIKED').catch((err) => console.error('[TrackLike] Falha ao registrar pontos', err))

  // V3 Plano 7 — tarefa de onboarding "dê sua primeira curtida" (paga 1x na
  // vida, ADICIONAL ao TRACK_LIKED de cima que tem teto diário)
  awardMilestoneOnce(userId, 'first_like_given', 'FIRST_LIKE_GIVEN').catch((err) =>
    console.error('[TrackLike] Falha ao registrar marco de 1ª curtida', err)
  )

  notifyTrackLike(trackId, userId).catch((err) => console.error('[TrackLike] Falha ao criar notificação', err))

  // V3 Plano 9 — a 1ª curtida é um item do checklist de completude; confere
  // se isso acabou de fechar os 100% do perfil (idempotente, não farmável)
  checkAndAwardProfileCompletion(userId).catch((err) =>
    console.error('[TrackLike] Falha ao checar completude de perfil', err)
  )

  return true
}

async function notifyTrackLike(trackId: string, likerId: string) {
  const [owner, track, liker] = await Promise.all([
    getTrackOwner(trackId),
    prisma.track.findUnique({ where: { id: trackId }, select: { title: true, slug: true } }),
    prisma.user.findUnique({ where: { id: likerId }, select: { handle: true, name: true, artisticName: true } }),
  ])
  if (!owner?.ownerId || !track) return

  await createNotification({
    userId: owner.ownerId,
    actorId: likerId,
    type: 'curtida',
    payload: {
      actorName: liker?.artisticName || liker?.name || (liker?.handle ? `@${liker.handle}` : 'Alguém'),
      trackTitle: track.title,
      trackSlug: track.slug,
    },
  })
}

/** Total de curtidas somadas em todas as músicas publicadas de um artista. */
export async function getArtistLikeCount(artistId: string): Promise<number> {
  return prisma.trackLike.count({
    where: { track: { artistId } },
  })
}
