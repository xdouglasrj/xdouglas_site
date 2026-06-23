import { NextRequest, NextResponse } from 'next/server'
import { refreshSession } from '@/lib/auth/session'
import { setAuthCookies } from '@/lib/auth/cookies'

// ============================================================
// POST /api/admin/auth/refresh
// Cookie path restrito: só acessível neste endpoint
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get('xd_refresh')?.value

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'Refresh token ausente', code: 'NO_REFRESH_TOKEN' },
      { status: 401 }
    )
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } =
      await refreshSession(refreshToken)

    await setAuthCookies(accessToken, newRefreshToken)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''

    // Refresh inválido — força novo login
    return NextResponse.json(
      {
        error: 'Sessão expirada. Faça login novamente.',
        code: 'REFRESH_INVALID',
        ...(message && { detail: message }),
      },
      { status: 401 }
    )
  }
}
