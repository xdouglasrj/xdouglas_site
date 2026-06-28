import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { trackEvent } from '@/lib/analytics/events'
import { buildEventContext } from '@/lib/analytics/context'
import type { EventType } from '@prisma/client'

// ============================================================
// Mapeamento de tipo client → EventType do Prisma
// ============================================================

const CLIENT_EVENT_MAP: Record<string, EventType> = {
  page_view: 'PAGE_VIEW',
  music_view: 'MUSIC_VIEW',
  play_start: 'PLAY_START',
  play_30s: 'PLAY_30S',
  play_complete: 'PLAY_COMPLETE',
}

// ============================================================
// Validação
// ============================================================

const eventSchema = z.object({
  type: z.enum(['page_view', 'music_view', 'play_start', 'play_30s', 'play_complete']),
  sessionId: z.string().uuid('sessionId deve ser um UUID'),
  trackId: z.string().uuid().optional(),
  path: z.string().max(500),
  referrer: z.string().max(500).optional(),
  metadata: z
    .object({
      durationSec: z.number().nonnegative().optional(),
    })
    .optional(),
})

// ============================================================
// POST /api/analytics
// Recebe eventos do client-side (disparados por useAnalytics)
// Consentimento verificado pelo client antes de chamar este endpoint
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Responde imediatamente para não bloquear o cliente.
  // O processamento acontece em background (fire-and-forget seguro).
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const { type, sessionId, trackId, path, referrer, metadata } = parsed.data
  const eventType = CLIENT_EVENT_MAP[type]

  // Processa em background — não await
  buildEventContext(request, {
    sessionId,
    trackId,
    referer: referrer ?? request.headers.get('referer') ?? undefined,
    metadata: { path, ...metadata },
  }).then((ctx) => trackEvent(eventType, ctx)).catch(() => {
    // Silencioso — analytics nunca quebra a experiência
  })

  // Retorna 204 imediatamente
  return new NextResponse(null, { status: 204 })
}
