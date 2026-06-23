import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import crypto from 'crypto'

// ============================================================
// Tipos
// ============================================================

export interface AdminTokenPayload extends JWTPayload {
  userId: string
  role: string
  sessionId: string
}

// ============================================================
// Constantes
// ============================================================

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

function getSecret(key: string): Uint8Array {
  const secret = process.env[key]
  if (!secret) throw new Error(`Env var ${key} não definida`)
  return new TextEncoder().encode(secret)
}

// ============================================================
// Access Token
// ============================================================

export async function signAccessToken(
  payload: Omit<AdminTokenPayload, 'iat' | 'exp'>
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('xdouglas')
    .setAudience('xdouglas-admin')
    .sign(getSecret('JWT_SECRET'))
}

export async function verifyAccessToken(
  token: string
): Promise<AdminTokenPayload> {
  const { payload } = await jwtVerify<AdminTokenPayload>(
    token,
    getSecret('JWT_SECRET'),
    {
      issuer: 'xdouglas',
      audience: 'xdouglas-admin',
    }
  )
  return payload
}

// ============================================================
// Refresh Token — gerado como UUID seguro, armazenado como hash
// ============================================================

export function generateRefreshToken(): string {
  return crypto.randomUUID() + '-' + crypto.randomBytes(32).toString('hex')
}

export async function signRefreshToken(
  payload: Omit<AdminTokenPayload, 'iat' | 'exp'>
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer('xdouglas')
    .setAudience('xdouglas-refresh')
    .sign(getSecret('REFRESH_TOKEN_SECRET'))
}

export async function verifyRefreshToken(
  token: string
): Promise<AdminTokenPayload> {
  const { payload } = await jwtVerify<AdminTokenPayload>(
    token,
    getSecret('REFRESH_TOKEN_SECRET'),
    {
      issuer: 'xdouglas',
      audience: 'xdouglas-refresh',
    }
  )
  return payload
}

// ============================================================
// Hash de tokens para armazenar no banco (nunca o token original)
// ============================================================

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// ============================================================
// Expiração em Date (para salvar no banco)
// ============================================================

export function accessTokenExpiresAt(): Date {
  return new Date(Date.now() + 15 * 60 * 1000) // 15 min
}

export function refreshTokenExpiresAt(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
}
