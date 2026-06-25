import { getAccessToken } from './cookies'
import { verifyAccessToken } from './jwt'
import { prisma } from '@/lib/prisma'

export interface CurrentUserBasics {
  id: string
  role: string
  photoUrl: string | null
  handle: string | null
}

export async function getCurrentUserBasics(): Promise<CurrentUserBasics | null> {
  const token = await getAccessToken()
  if (!token) return null
  try {
    const payload = await verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { photoUrl: true, handle: true },
    })
    return { id: payload.userId, role: payload.role, photoUrl: user?.photoUrl ?? null, handle: user?.handle ?? null }
  } catch {
    return null
  }
}
