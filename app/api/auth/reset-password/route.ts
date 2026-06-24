import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { hashPasswordResetToken } from '@/lib/auth/password-reset'
import { revokeAllUserSessions } from '@/lib/auth/session'
import { forgotPasswordRateLimit } from '@/lib/security/rate-limit'
import { extractIp } from '@/lib/analytics/geo'

// ============================================================
// Validação de input
// ============================================================

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token inválido'),
  password: z
    .string()
    .min(8, 'Senha muito curta')
    .refine((pw) => (pw.match(/[A-Z]/g) ?? []).length >= 2, 'Senha precisa de pelo menos 2 letras maiúsculas')
    .refine((pw) => (pw.match(/[^A-Za-z0-9]/g) ?? []).length >= 2, 'Senha precisa de pelo menos 2 caracteres especiais'),
})

// ============================================================
// POST /api/auth/reset-password
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = extractIp(request)
  const ipIdentifier = ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const ipKey = Buffer.from(ipIdentifier).toString('base64').slice(0, 32)

  // Reaproveita o limite de "esqueci senha" para travar tentativas de força bruta no token
  const rateLimit = forgotPasswordRateLimit(ipKey)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde antes de tentar novamente.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido', code: 'INVALID_BODY' }, { status: 400 })
  }

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { token, password } = parsed.data
  const tokenHash = hashPasswordResetToken(token)

  const user = await prisma.user.findUnique({
    where: { resetPasswordTokenHash: tokenHash },
    select: { id: true, resetPasswordExpiresAt: true, resetPasswordUsedAt: true },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'Link inválido ou expirado. Solicite uma nova redefinição.', code: 'INVALID_TOKEN' },
      { status: 400 }
    )
  }

  if (user.resetPasswordUsedAt) {
    return NextResponse.json(
      { error: 'Este link já foi utilizado para redefinir a senha. Solicite um novo link.', code: 'TOKEN_ALREADY_USED' },
      { status: 409 }
    )
  }

  if (!user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
    return NextResponse.json(
      { error: 'Link inválido ou expirado. Solicite uma nova redefinição.', code: 'INVALID_TOKEN' },
      { status: 400 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      resetPasswordUsedAt: new Date(),
    },
  })

  // Invalida sessões existentes — força novo login com a senha nova
  await revokeAllUserSessions(user.id)

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'PASSWORD_RESET_COMPLETED' },
  })

  return NextResponse.json({ ok: true })
}
