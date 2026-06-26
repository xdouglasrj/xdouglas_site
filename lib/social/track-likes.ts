import { prisma } from '@/lib/prisma'

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
  return true
}

/** Total de curtidas somadas em todas as músicas publicadas de um artista. */
export async function getArtistLikeCount(artistId: string): Promise<number> {
  return prisma.trackLike.count({
    where: { track: { artistId } },
  })
}
