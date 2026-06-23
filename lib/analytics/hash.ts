import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

// ============================================================
// Hash de IP com salt rotativo
// ============================================================

/**
 * Retorna a chave de hash ativa para o período atual.
 * Se não existir, cria uma nova (caso de primeiro uso ou rotação).
 */
export async function getActiveHashKey(): Promise<{
  id: string
  saltEncrypted: string
}> {
  const now = new Date()

  const active = await prisma.analyticsHashKey.findFirst({
    where: {
      active: true,
      periodStart: { lte: now },
      periodEnd: { gte: now },
    },
    select: { id: true, saltEncrypted: true },
  })

  if (active) return active

  // Nenhuma chave ativa — cria para o mês atual
  return createHashKey()
}

/**
 * Cria uma nova chave de hash para o próximo período mensal.
 */
export async function createHashKey(): Promise<{
  id: string
  saltEncrypted: string
}> {
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Gera salt aleatório e criptografa com a chave de aplicação
  const rawSalt = crypto.randomBytes(32).toString('hex')
  const saltEncrypted = encryptSalt(rawSalt)

  // Desativa chaves anteriores
  await prisma.analyticsHashKey.updateMany({
    where: { active: true },
    data: { active: false },
  })

  const key = await prisma.analyticsHashKey.create({
    data: {
      saltEncrypted,
      periodStart,
      periodEnd,
      active: true,
    },
    select: { id: true, saltEncrypted: true },
  })

  return key
}

/**
 * Gera o hash SHA-256 do IP com o salt do período.
 * Resultado: string hex de 64 chars, sem possibilidade de reversão.
 */
export function hashIp(ip: string, saltEncrypted: string): string {
  const salt = decryptSalt(saltEncrypted)
  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex')
}

// ============================================================
// Criptografia do salt (AES-256-GCM)
// ============================================================

function getEncryptionKey(): Buffer {
  const key = process.env.ANALYTICS_ENCRYPTION_KEY
  if (!key) throw new Error('ANALYTICS_ENCRYPTION_KEY não definida')
  // Aceita chave hex de 64 chars (32 bytes) ou string arbitrária com SHA-256
  if (key.length === 64 && /^[0-9a-f]+$/i.test(key)) {
    return Buffer.from(key, 'hex')
  }
  return crypto.createHash('sha256').update(key).digest()
}

function encryptSalt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  // Formato: iv(24) + authTag(32) + encrypted
  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join('.')
}

function decryptSalt(ciphertext: string): string {
  const key = getEncryptionKey()
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split('.')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}
