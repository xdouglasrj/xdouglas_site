import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { forgotPasswordRateLimit } from '@/lib/security/rate-limit'
import { extractIp } from '@/lib/analytics/geo'
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  passwordResetExpiresAt,
} from '@/lib/auth/password-reset'
import { sendPasswordResetEmail } from '@/lib/email/send-password-reset'

// ============================================================
// Validação de input — aceita email ou nome de usuário
// ============================================================

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Informe seu email ou usuário'),
})

// Resposta sempre genérica — não revela se o email/usuário existe
// (evita enumeração de contas)
const GENERIC_MESSAGE =
  'Se encontrarmos uma conta com esses dados, enviaremos um email com instruções para redefinir sua senha.'

// ============================================================
// POST /api/auth/forgot-password
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = extractIp(request)
  const ipIdentifier = ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const ipKey = Buffer.from(ipIdentifier).toString('base64').slice(0, 32)

  const rateLimit = forgotPasswordRateLimit(ipKey)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Muitas tentativas. Aguarde antes de tentar novamente.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido', code: 'INVALID_BODY' }, { status: 400 })
  }

  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const identifier = parsed.data.identifier.trim().toLowerCase()
  const isEmail = identifier.includes('@')

  const user = await prisma.user.findUnique({
    where: isEmail ? { email: identifier } : { username: identifier },
    select: { id: true, email: true, active: true, blocked: true },
  })

  // Só envia email se a conta existir e estiver ativa — mas a resposta
  // HTTP é sempre a mesma, para não revelar essa informação ao cliente
  if (user && user.active && !user.blocked) {
    const token = generatePasswordResetToken()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: hashPasswordResetToken(token),
        resetPasswordExpiresAt: passwordResetExpiresAt(),
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const resetUrl = `${appUrl}/redefinir-senha?token=${token}`

    await sendPasswordResetEmail({ to: user.email, resetUrl })

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'PASSWORD_RESET_REQUESTED' },
    })
  }

  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
}
