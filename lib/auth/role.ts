import { getAccessToken } from './cookies'
import { verifyAccessToken } from './jwt'

export async function getCurrentRole(): Promise<string | null> {
  const token = await getAccessToken()
  if (!token) return null
  try {
    const payload = await verifyAccessToken(token)
    return payload.role
  } catch {
    return null
  }
}
