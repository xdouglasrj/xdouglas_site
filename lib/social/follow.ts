import { prisma } from '@/lib/prisma'
import { toPublicUser, PUBLIC_USER_SELECT, type PublicUser } from './public-user'

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  })
  return !!follow
}

export async function getFollowCounts(userId: string) {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ])
  return { followers, following }
}

/** Liga/desliga o follow. Retorna o novo estado (true = seguindo). */
export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) {
    throw new Error('Não é possível seguir a si mesmo')
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  })

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } })
    return false
  }

  await prisma.follow.create({ data: { followerId, followingId } })
  return true
}

interface ListFollowOptions {
  q?: string
  limit?: number
}

// Filtro de busca por @handle/nome aplicado sobre o User do outro lado do Follow
function userNameFilter(q: string | undefined) {
  if (!q?.trim()) return undefined
  const query = q.trim().replace(/^@/, '')
  return {
    OR: [
      { handle: { contains: query, mode: 'insensitive' as const } },
      { name: { contains: query, mode: 'insensitive' as const } },
      { artisticName: { contains: query, mode: 'insensitive' as const } },
    ],
  }
}

/** Quem segue `userId` — usado no popup de seguidores. */
export async function listFollowers(userId: string, opts: ListFollowOptions = {}): Promise<PublicUser[]> {
  const { q, limit = 50 } = opts
  const rows = await prisma.follow.findMany({
    where: {
      followingId: userId,
      follower: { active: true, blocked: false, handle: { not: null }, ...userNameFilter(q) },
    },
    select: { follower: { select: PUBLIC_USER_SELECT } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return rows.map((r) => toPublicUser(r.follower))
}

/** Quem `userId` segue — usado no popup de seguindo. */
export async function listFollowing(userId: string, opts: ListFollowOptions = {}): Promise<PublicUser[]> {
  const { q, limit = 50 } = opts
  const rows = await prisma.follow.findMany({
    where: {
      followerId: userId,
      following: { active: true, blocked: false, handle: { not: null }, ...userNameFilter(q) },
    },
    select: { following: { select: PUBLIC_USER_SELECT } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return rows.map((r) => toPublicUser(r.following))
}
