import { getAccessToken } from './cookies'
import { verifyAccessToken } from './jwt'
import { prisma } from '@/lib/prisma'

export interface CurrentUserBasics {
  id: string
  role: string
  photoUrl: string | null
  handle: string | null
  mappingEnabled: boolean
  /** já enviou ao menos uma música — controla o link "Suas músicas" */
  hasUploads: boolean
}

export async function getCurrentUserBasics(): Promise<CurrentUserBasics | null> {
  const token = await getAccessToken()
  if (!token) return null
  try {
    const payload = await verifyAccessToken(token)
    const [user, uploadCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: payload.userId },
        select: { photoUrl: true, handle: true, mappingEnabled: true },
      }),
      prisma.track.count({ where: { submittedById: payload.userId } }),
    ])
    return {
      id: payload.userId,
      role: payload.role,
      photoUrl: user?.photoUrl ?? null,
      handle: user?.handle ?? null,
      mappingEnabled: user?.mappingEnabled ?? false,
      hasUploads: uploadCount > 0,
    }
  } catch {
    return null
  }
}
