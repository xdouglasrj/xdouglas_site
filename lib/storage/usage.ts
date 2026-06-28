import { prisma } from '@/lib/prisma'

/** Soma em bytes de todas as músicas que o usuário enviou (submittedById). */
export async function getUserStorageUsedBytes(userId: string): Promise<number> {
  const result = await prisma.track.aggregate({
    where: { submittedById: userId },
    _sum: { audioSizeBytes: true },
  })
  return Number(result._sum.audioSizeBytes ?? 0)
}
