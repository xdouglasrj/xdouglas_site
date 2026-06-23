import { getAccessToken } from './cookies'
import { verifyAccessToken } from './jwt'
import { prisma } from '@/lib/prisma'

export interface CurrentUserBasics {
  role: string
  photoUrl: string | null
}

export async function getCurrentUserBasics(): Promise<CurrentUserBasics | null> {
  const token = await getAccessToken()
  if (!token) return null
  try {
    const payload = await verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { photoUrl: true },
    })
    return { role: payload.role, photoUrl: user?.photoUrl ?? null }
  } catch {
    return null
  }
}
