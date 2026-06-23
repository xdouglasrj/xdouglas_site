import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revokeSession } from '@/lib/auth/session'
import { clearAuthCookies } from '@/lib/auth/cookies'
import { getRequestIpHash } from '@/lib/auth/guard'
import { verifyAccessToken } from '@/lib/auth/jwt'

// ============================================================
// POST /api/admin/auth/logout
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('xd_access')?.value

  if (token) {
    try {
      // Revoga a sessão no banco antes de limpar o cookie
      await revokeSession(token)

      // Audit log do logout
      const payload = await verifyAccessToken(token).catch(() => null)
      if (payload) {
        const ipHash = await getRequestIpHash(request)
        await prisma.auditLog.create({
          data: {
            userId: payload.userId,
            action: 'LOGOUT',
            ipHash,
          },
        })
      }
    } catch {
      // Mesmo com erro, limpa os cookies
    }
  }

  await clearAuthCookies()

  return NextResponse.json({ ok: true })
}
