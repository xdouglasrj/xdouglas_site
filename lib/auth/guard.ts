import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from './session'
import { getActiveHashKey, hashIp } from '@/lib/analytics/hash'
import { extractIp } from '@/lib/analytics/geo'
import type { AdminTokenPayload } from './jwt'

// ============================================================
// Tipos
// ============================================================

export interface AuthContext {
  payload: AdminTokenPayload
  userId: string
  role: string
  sessionId: string
}

type ApiHandler = (
  request: NextRequest,
  auth: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>

// ============================================================
// withAuth — wrapper para API routes protegidas
// Adiciona segunda camada de validação (banco) sobre o middleware edge
// ============================================================

export function withAuth(handler: ApiHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const token = request.cookies.get('xd_access')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado', code: 'NO_TOKEN' },
        { status: 401 }
      )
    }

    try {
      const payload = await validateSession(token)

      const auth: AuthContext = {
        payload,
        userId: payload.userId,
        role: payload.role,
        sessionId: payload.sessionId,
      }

      const params = await context.params

      return await handler(request, auth, params)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Token inválido'

      // Sessão revogada ou token expirado — instrui o client a tentar refresh
      if (message.includes('expirado') || message.includes('não encontrada')) {
        return NextResponse.json(
          { error: 'Sessão expirada', code: 'SESSION_EXPIRED' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'Não autorizado', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }
  }
}

// ============================================================
// withRole — garante role mínima além da autenticação
// ============================================================

export function withRole(role: string, handler: ApiHandler) {
  return withAuth(async (request, auth, params) => {
    const roleOrder = ['GUEST', 'MEMBER', 'ARTIST', 'ARTIST_SUPPORTER', 'ADMIN']
    const required = roleOrder.indexOf(role)
    const current = roleOrder.indexOf(auth.role)

    if (current < required) {
      return NextResponse.json(
        { error: 'Acesso negado', code: 'INSUFFICIENT_ROLE' },
        { status: 403 }
      )
    }

    return handler(request, auth, params)
  })
}

// ============================================================
// Resposta de erro padronizada
// ============================================================

export function apiError(
  message: string,
  status: number,
  code?: string
): NextResponse {
  return NextResponse.json({ error: message, code }, { status })
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

// ============================================================
// Helper: extrai e hashes IP para audit logs dentro de API routes
// ============================================================

export async function getRequestIpHash(
  request: NextRequest
): Promise<string | undefined> {
  const ip = extractIp(request)
  if (!ip) return undefined

  try {
    const hashKey = await getActiveHashKey()
    return hashIp(ip, hashKey.saltEncrypted)
  } catch {
    return undefined
  }
}
