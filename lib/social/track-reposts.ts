import { prisma } from '@/lib/prisma'
import { addPoints } from '@/lib/points/points-service'
import { getTrackOwner } from './track-comments'
import { createNotification } from '@/lib/notifications/notifications'

// ============================================================
// Reposts de música (V3 Plano 3) — molde de track-likes.ts
// ============================================================

export async function isTrackReposted(trackId: string, userId: string): Promise<boolean> {
  const repost = await prisma.trackRepost.findUnique({
    where: { trackId_userId: { trackId, userId } },
  })
  return !!repost
}

export type ToggleRepostResult =
  | { ok: true; reposted: boolean; repostCount: number }
  | { ok: false; reason: 'OWN_TRACK' | 'NOT_FOUND' }

/** Liga/desliga o repost. Repostar a própria música é bloqueado. */
export async function toggleTrackRepost(trackId: string, userId: string): Promise<ToggleRepostResult> {
  const owner = await getTrackOwner(trackId)
  if (owner === null) return { ok: false, reason: 'NOT_FOUND' }
  if (owner.ownerId === userId) return { ok: false, reason: 'OWN_TRACK' }

  const existing = await prisma.trackRepost.findUnique({
    where: { trackId_userId: { trackId, userId } },
  })

  let reposted: boolean
  if (existing) {
    await prisma.trackRepost.delete({ where: { id: existing.id } })
    reposted = false
  } else {
    await prisma.trackRepost.create({ data: { trackId, userId } })
    reposted = true

    if (owner.ownerId) {
      // Ponto vai para o artista que RECEBEU o repost (teto diário no service)
      addPoints(owner.ownerId, 'REPOST_RECEIVED').catch((err) =>
        console.error('[TrackRepost] Falha ao registrar pontos', err)
      )
      notifyTrackRepost(trackId, owner.ownerId, userId).catch((err) =>
        console.error('[TrackRepost] Falha ao criar notificação', err)
      )
    }
  }

  const repostCount = await prisma.trackRepost.count({ where: { trackId } })
  return { ok: true, reposted, repostCount }
}

/**
 * Notifica o artista — só no PRIMEIRO repost daquele usuário naquela música.
 * Desfazer e repostar de novo não spamma: checa se a notificação já existe.
 */
async function notifyTrackRepost(trackId: string, ownerId: string, reposterId: string) {
  const [track, reposter] = await Promise.all([
    prisma.track.findUnique({ where: { id: trackId }, select: { title: true, slug: true } }),
    prisma.user.findUnique({ where: { id: reposterId }, select: { handle: true, name: true, artisticName: true } }),
  ])
  if (!track || !reposter) return

  const actorHandle = reposter.handle ?? reposterId
  const alreadyNotified = await prisma.notification.findFirst({
    where: {
      userId: ownerId,
      type: 'repost',
      AND: [
        { payload: { path: ['trackSlug'], equals: track.slug } },
        { payload: { path: ['actorHandle'], equals: actorHandle } },
      ],
    },
    select: { id: true },
  })
  if (alreadyNotified) return

  await createNotification({
    userId: ownerId,
    actorId: reposterId,
    type: 'repost',
    payload: {
      actorName: reposter.artisticName || reposter.name || (reposter.handle ? `@${reposter.handle}` : 'Alguém'),
      actorHandle,
      trackTitle: track.title,
      trackSlug: track.slug,
    },
  })
}

/** Reposts de um usuário para a aba do perfil — mais recente primeiro. */
export async function listUserReposts(userId: string, limit = 50) {
  const reposts = await prisma.trackRepost.findMany({
    where: { userId, track: { published: true } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      createdAt: true,
      track: {
        select: {
          id: true,
          slug: true,
          title: true,
          genre: true,
          coverUrl: true,
          producerName: true,
          artist: { select: { name: true } },
          _count: { select: { likes: true } },
        },
      },
    },
  })

  return reposts.map((r) => ({
    repostedAt: r.createdAt.toISOString(),
    track: {
      id: r.track.id,
      slug: r.track.slug,
      title: r.track.title,
      genre: r.track.genre,
      coverUrl: r.track.coverUrl,
      producerName: r.track.producerName,
      artistName: r.track.artist.name,
      likeCount: r.track._count.likes,
    },
  }))
}

/**
 * Reposts de quem o usuário segue — pronta para o futuro feed de atividade.
 * A home logada (/inicio) hoje só tem feed de POSTS, então esta query ainda
 * não é consumida em lugar nenhum (decisão do Plano 3: não criar feed novo).
 */
export async function getFollowingReposts(userId: string, limit = 20) {
  return prisma.trackRepost.findMany({
    where: {
      user: { followers: { some: { followerId: userId } } },
      track: { published: true },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      createdAt: true,
      user: { select: { handle: true, name: true, artisticName: true, photoUrl: true } },
      track: {
        select: {
          id: true,
          slug: true,
          title: true,
          coverUrl: true,
          artist: { select: { name: true } },
        },
      },
    },
  })
}
