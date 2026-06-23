import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { extractIp } from '@/lib/analytics/geo'
import { getActiveHashKey, hashIp } from '@/lib/analytics/hash'

// ============================================================
// POST /api/analytics/consent
// Registra CONSENT_GIVEN e CONSENT_REVOKED em consent_events
// Rastreabilidade LGPD — nunca armazena IP direto
// ============================================================

const consentSchema = z.object({
  sessionId: z.string().uuid(),
  action: z.enum(['CONSENT_GIVEN', 'CONSENT_REVOKED']),
  consentType: z.enum(['analytics', 'all']),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const parsed = consentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const { sessionId, action, consentType } = parsed.data

  // Hash do IP para rastreabilidade (sem armazenar IP)
  let ipHash: string | undefined
  const ip = extractIp(request)
  if (ip) {
    try {
      const hashKey = await getActiveHashKey()
      ipHash = hashIp(ip, hashKey.saltEncrypted)
    } catch {
      // Não bloqueia
    }
  }

  try {
    await prisma.consentEvent.create({
      data: {
        sessionId,
        eventType: action,
        consentType,
        ipHash,
        userAgent: request.headers.get('user-agent'),
      },
    })
  } catch {
    // Silencioso
  }

  return new NextResponse(null, { status: 204 })
}
