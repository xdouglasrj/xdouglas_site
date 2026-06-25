import { prisma } from '@/lib/prisma'
import { toPublicUser, PUBLIC_USER_SELECT, type PublicUser } from './public-user'

export type UserSearchResult = PublicUser

/**
 * Busca usuários públicos pelo @handle ou pelo nome — usada na busca geral
 * do site. Respeita a privacidade de nome (showName): se o usuário escondeu
 * o nome real, exibe o nome artístico ou o próprio handle.
 */
export async function searchUsers(rawQuery: string, limit = 20): Promise<UserSearchResult[]> {
  const query = rawQuery.trim().replace(/^@/, '')
  if (!query) return []

  const users = await prisma.user.findMany({
    where: {
      active: true,
      blocked: false,
      handle: { not: null },
      OR: [
        { handle: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { artisticName: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: PUBLIC_USER_SELECT,
    take: limit,
    orderBy: { handle: 'asc' },
  })

  return users.map(toPublicUser)
}
