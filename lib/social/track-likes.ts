import { prisma } from '@/lib/prisma'
import { addPoints } from '@/lib/points/points-service'
import { getTrackOwner } from './track-comments'
import { createNotification } from '@/lib/notifications/notifications'

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

  notifyTrackLike(trackId, userId).catch((err) => console.error('[TrackLike] Falha ao criar notificação', err))

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
