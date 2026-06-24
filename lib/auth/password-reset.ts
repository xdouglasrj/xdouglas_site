import crypto from 'crypto'
import { hashToken } from './jwt'

// ============================================================
// Token de redefinição de senha — gerado aleatório, armazenado
// como hash (nunca o valor original, mesmo padrão dos refresh tokens)
// ============================================================

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashPasswordResetToken(token: string): string {
  return hashToken(token)
}

export function passwordResetExpiresAt(): Date {
  return new Date(Date.now() + RESET_TOKEN_TTL_MS)
}
