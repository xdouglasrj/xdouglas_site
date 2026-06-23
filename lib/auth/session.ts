import { prisma } from '@/lib/prisma'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  accessTokenExpiresAt,
  refreshTokenExpiresAt,
} from './jwt'
import type { AdminTokenPayload } from './jwt'

// ============================================================
// Tipos
// ============================================================

export interface SessionContext {
  ipHash?: string
  userAgent?: string
  device?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ============================================================
// Criar sessão — chamado após login bem-sucedido
// ============================================================

export async function createSession(
  userId: string,
  role: string,
  context: SessionContext
): Promise<AuthTokens> {
  // Gera tokens assinados
  const sessionId = crypto.randomUUID()

  const payload: Omit<AdminTokenPayload, 'iat' | 'exp'> = {
    userId,
    role,
    sessionId,
  }

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ])

  // Persiste apenas os hashes — nunca os tokens originais
  await prisma.adminSession.create({
    data: {
      id: sessionId,
      userId,
      accessTokenHash: hashToken(accessToken),
      refreshTokenHash: hashToken(refreshToken),
      ipHash: context.ipHash,
      userAgent: context.userAgent,
      device: context.device,
      expiresAt: refreshTokenExpiresAt(), // sessão vive enquanto o refresh for válido
    },
  })

  return { accessToken, refreshToken }
}

// ============================================================
// Validar sessão — chamado nas API routes (segunda camada após middleware)
// ============================================================

export async function validateSession(
  accessToken: string
): Promise<AdminTokenPayload> {
  const { verifyAccessToken } = await import('./jwt')
  const payload = await verifyAccessToken(accessToken)

  // Confirma que a sessão existe no banco e não foi revogada
  const session = await prisma.adminSession.findUnique({
    where: { accessTokenHash: hashToken(accessToken) },
    select: { revokedAt: true, expiresAt: true },
  })

  if (!session) {
    throw new Error('Sessão não encontrada')
  }

  if (session.revokedAt) {
    throw new Error('Sessão revogada')
  }

  if (session.expiresAt < new Date()) {
    throw new Error('Sessão expirada')
  }

  return payload
}

// ============================================================
// Refresh — troca access token expirado por um novo
// ============================================================

export async function refreshSession(
  refreshToken: string
): Promise<AuthTokens> {
  const payload = await verifyRefreshToken(refreshToken)

  // Valida refresh token no banco
  const session = await prisma.adminSession.findUnique({
    where: { refreshTokenHash: hashToken(refreshToken) },
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      expiresAt: true,
      user: { select: { role: true, active: true } },
    },
  })

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new Error('Refresh token inválido ou expirado')
  }

  if (!session.user.active) {
    throw new Error('Usuário inativo')
  }

  // Gera novo access token (mantém o mesmo sessionId e refresh token)
  const newPayload: Omit<AdminTokenPayload, 'iat' | 'exp'> = {
    userId: payload.userId,
    role: session.user.role,
    sessionId: session.id,
  }

  const newAccessToken = await signAccessToken(newPayload)

  // Atualiza o hash do access token na sessão existente
  await prisma.adminSession.update({
    where: { id: session.id },
    data: {
      accessTokenHash: hashToken(newAccessToken),
      expiresAt: refreshTokenExpiresAt(), // renova o TTL da sessão
    },
  })

  return { accessToken: newAccessToken, refreshToken }
}

// ============================================================
// Revogar sessão — chamado no logout
// ============================================================

export async function revokeSession(accessToken: string): Promise<void> {
  await prisma.adminSession.updateMany({
    where: { accessTokenHash: hashToken(accessToken) },
    data: { revokedAt: new Date() },
  })
}

// ============================================================
// Revogar todas as sessões do usuário (ex: troca de senha)
// ============================================================

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.adminSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
