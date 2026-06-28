import { prisma } from '@/lib/prisma'
import { getPlanQuotaBytes } from '@/lib/settings/plan-quotas'
import type { UserPlan } from '@prisma/client'

export interface UserStatsRow {
  id: string
  displayName: string
  handle: string | null
  plan: UserPlan
  trackCount: number
  storageUsedBytes: number
  storageQuotaBytes: number
  likeCount: number
  commentCount: number
  followerCount: number
  followingCount: number
}

/**
 * Painel de controle por usuário (artistas/quem já enviou música) usado em
 * /admin/musicas — agrega músicas, espaço usado, plano e métricas sociais.
 */
export async function getUserStatsPanel(): Promise<UserStatsRow[]> {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: ['ARTIST', 'ARTIST_SUPPORTER'] } },
        { artist: { isNot: null } },
        { submittedTracks: { some: {} } },
      ],
    },
    select: {
      id: true,
      name: true,
      handle: true,
      artisticName: true,
      plan: true,
      artist: { select: { id: true } },
      _count: { select: { submittedTracks: true, following: true, followers: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (users.length === 0) return []

  const userIds = users.map((u) => u.id)

  const storageRows = await prisma.track.groupBy({
    by: ['submittedById'],
    where: { submittedById: { in: userIds } },
    _sum: { audioSizeBytes: true },
  })
  const storageByUserId = new Map(
    storageRows.map((r) => [r.submittedById as string, Number(r._sum.audioSizeBytes ?? 0)])
  )

  const socialCounts = await Promise.all(
    users.map(async (u) => {
      if (!u.artist) return { userId: u.id, likes: 0, comments: 0 }
      const [likes, comments] = await Promise.all([
        prisma.trackLike.count({ where: { track: { artistId: u.artist.id } } }),
        prisma.trackComment.count({ where: { track: { artistId: u.artist.id } } }),
      ])
      return { userId: u.id, likes, comments }
    })
  )
  const socialByUserId = new Map(socialCounts.map((s) => [s.userId, s]))

  return users.map((u) => {
    const social = socialByUserId.get(u.id)
    return {
      id: u.id,
      displayName: u.artisticName ?? u.name ?? u.handle ?? 'Sem nome',
      handle: u.handle,
      plan: u.plan,
      trackCount: u._count.submittedTracks,
      storageUsedBytes: storageByUserId.get(u.id) ?? 0,
      storageQuotaBytes: getPlanQuotaBytes(u.plan),
      likeCount: social?.likes ?? 0,
      commentCount: social?.comments ?? 0,
      followerCount: u._count.followers,
      followingCount: u._count.following,
    }
  })
}
