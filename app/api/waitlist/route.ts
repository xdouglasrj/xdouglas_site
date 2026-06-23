import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { waitlistRateLimit } from '@/lib/security/rate-limit'
import { extractIp } from '@/lib/analytics/geo'
import { trackEvent } from '@/lib/analytics/events'
import { buildEventContext } from '@/lib/analytics/context'
import type { WaitlistTipoUsuario } from '@prisma/client'

// ============================================================
// Validação
// ============================================================

const waitlistSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome muito curto').max(100).optional(),
  artisticName: z.string().max(100).optional(),
  phone: z.string().min(8, 'WhatsApp inválido').max(20),
  tipoUsuario: z.enum(['DJ', 'PRODUTOR', 'ARTISTA', 'MUSICO', 'OUVINTE', 'OUTRO']),
  message: z.string().max(500).optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar a política de privacidade' }),
  }),
})

// ============================================================
// POST /api/waitlist
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit: 3 por hora por IP
  const ip = extractIp(request)
  const ipKey = Buffer.from(ip ?? 'unknown').toString('base64').slice(0, 32)
  const rateLimit = waitlistRateLimit(ipKey)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde antes de tentar novamente.', code: 'RATE_LIMITED' },
      { status: 429 }
    )
  }

  // Valida body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = waitlistSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Dados inválidos',
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { email, name, artisticName, phone, tipoUsuario, message } = parsed.data

  try {
    await prisma.waitlist.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name?.trim(),
        artisticName: artisticName?.trim(),
        phone: phone.trim(),
        tipoUsuario: tipoUsuario as WaitlistTipoUsuario,
        message: message?.trim(),
        consentedAt: new Date(),
      },
    })
  } catch (err: unknown) {
    // Email duplicado
    if (
      typeof err === 'object' && err !== null &&
      'code' in err && (err as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Este email já está na lista de espera.', code: 'DUPLICATE_EMAIL' },
        { status: 409 }
      )
    }
    console.error('[Waitlist]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }

  // Registra evento de analytics (fire-and-forget)
  buildEventContext(request).then((ctx) =>
    trackEvent('WAITLIST_JOIN', { ...ctx, metadata: { tipoUsuario } })
  ).catch(() => {})

  return NextResponse.json({ ok: true }, { status: 201 })
}
