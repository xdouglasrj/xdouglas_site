import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPasswordResetToken } from '@/lib/auth/password-reset'
import { resetPasswordCheckRateLimit } from '@/lib/security/rate-limit'
import { extractIp } from '@/lib/analytics/geo'

// ============================================================
// GET /api/auth/reset-password/[token]
// Consulta o status do link (sem consumi-lo) — usada pela página
// de redefinição para decidir se mostra o formulário, a mensagem
// de "link já usado" ou a mensagem de "link inválido/expirado".
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const ip = extractIp(request)
  const ipIdentifier = ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const ipKey = Buffer.from(ipIdentifier).toString('base64').slice(0, 32)

  const rateLimit = resetPasswordCheckRateLimit(ipKey)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde antes de tentar novamente.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    )
  }

  const { token } = await params
  const tokenHash = hashPasswordResetToken(token)

  const user = await prisma.user.findUnique({
    where: { resetPasswordTokenHash: tokenHash },
    select: { resetPasswordExpiresAt: true, resetPasswordUsedAt: true },
  })

  if (!user) {
    return NextResponse.json({ status: 'invalid' })
  }

  if (user.resetPasswordUsedAt) {
    return NextResponse.json({ status: 'used' })
  }

  if (!user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
    return NextResponse.json({ status: 'invalid' })
  }

  return NextResponse.json({ status: 'valid' })
}
