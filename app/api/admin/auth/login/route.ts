import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth/session'
import { setAuthCookies } from '@/lib/auth/cookies'
import { loginRateLimit } from '@/lib/security/rate-limit'
import { extractIp } from '@/lib/analytics/geo'
import { getActiveHashKey, hashIp } from '@/lib/analytics/hash'
import { isSuspiciousUserAgent } from '@/lib/security/detect-bot'

// ============================================================
// Validação de input
// ============================================================

const loginSchema = z.object({
  username: z.string().min(1, 'Usuário obrigatório'),
  password: z.string().min(8, 'Senha muito curta'),
})

// ============================================================
// POST /api/admin/auth/login
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Extrai e hash do IP para rate limit (sem armazenar IP)
  const ip = extractIp(request)
  const ipIdentifier = ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'

  // Hash simples para rate limit (não precisa ser o hash LGPD completo)
  const ipKey = Buffer.from(ipIdentifier).toString('base64').slice(0, 32)

  // 2. Rate limit: 5 tentativas por 15 min por IP
  const rateLimit = loginRateLimit(ipKey)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Muitas tentativas. Aguarde antes de tentar novamente.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimit.resetAt.toISOString(),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
        },
      }
    )
  }

  // 3. Valida body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Body inválido', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { username, password } = parsed.data
  const identifier = username.toLowerCase().trim()
  const isEmail = identifier.includes('@')

  // 4. Busca usuário (aceita username ou email) — tempo constante mesmo se
  // não existir (evita timing attack)
  const user = await prisma.user.findUnique({
    where: isEmail ? { email: identifier } : { username: identifier },
    select: { id: true, username: true, password: true, role: true, name: true, active: true, blocked: true, lastLoginAt: true },
  })

  // Faz bcrypt mesmo com usuário inexistente para evitar timing attack
  const dummyHash = '$2b$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  const isValid = await bcrypt.compare(password, user?.password ?? dummyHash)

  if (!user || !isValid || !user.active || user.blocked) {
    return NextResponse.json(
      { error: 'Usuário ou senha incorretos', code: 'INVALID_CREDENTIALS' },
      { status: 401 }
    )
  }

  // 5. Detecta contexto do dispositivo
  const userAgent = request.headers.get('user-agent') ?? undefined
  const device = detectDevice(userAgent)

  // 6. Hash LGPD do IP para armazenar na sessão
  let ipHash: string | undefined
  if (ip) {
    try {
      const hashKey = await getActiveHashKey()
      ipHash = hashIp(ip, hashKey.saltEncrypted)
    } catch {
      // Não bloqueia o login se analytics falhar
    }
  }

  // 7. Cria sessão e gera tokens
  const { accessToken, refreshToken } = await createSession(user.id, user.role, {
    ipHash,
    userAgent,
    device,
  })

  // 8. Persiste cookies HTTP-only
  await setAuthCookies(accessToken, refreshToken)

  // Primeiro login do dia? (compara data local do último login com hoje)
  const now = new Date()
  const isFirstLoginToday =
    !user.lastLoginAt || !isSameDay(user.lastLoginAt, now)

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: now },
  })

  // 9. Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      ipHash,
      metadata: { device, suspicious: isSuspiciousUserAgent(userAgent) },
    },
  })

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      isFirstLoginToday,
    },
  })
}

// ============================================================
// Helper: compara se duas datas são do mesmo dia (UTC)
// ============================================================

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

// ============================================================
// Helper: detecta tipo de dispositivo pelo user-agent
// ============================================================

function detectDevice(userAgent?: string): string {
  if (!userAgent) return 'unknown'
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return 'mobile'
  if (/tablet/i.test(userAgent)) return 'tablet'
  return 'desktop'
}
