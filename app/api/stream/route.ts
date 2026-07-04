import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { processStream } from '@/lib/downloads/service'
import { isFeatureEnabled } from '@/lib/settings/feature-flags'

// ============================================================
// POST /api/stream
//
// Gera uma URL assinada (TTL curto) para tocar a faixa inline
// ("Ouvir"), sem contar como download nem expor a audioKey.
// PÚBLICA de propósito: NÃO está em MEMBER_PREFIXES nem no matcher
// do middleware — precisa tocar sem login para visitante/Googlebot
// e para o player embedável (/embed/*, V3 Plano 8). Baixar continua
// exigindo conta (/api/download permanece protegido).
// ============================================================

const streamSchema = z.object({
  trackId: z.string().uuid('trackId deve ser um UUID válido'),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Body inválido', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  const parsed = streamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'trackId inválido', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  if (!(await isFeatureEnabled('ouvir'))) {
    return NextResponse.json({ error: 'O player está em manutenção no momento', code: 'FEATURE_DISABLED' }, { status: 403 })
  }

  const result = await processStream(parsed.data.trackId, request)

  if (!result.ok) {
    const { code, message, retryAfter } = result.error
    const status =
      code === 'NOT_FOUND' ? 404
      : code === 'NOT_PUBLISHED' ? 404
      : code === 'RATE_LIMITED' ? 429
      : code === 'STORAGE_ERROR' ? 503
      : 500

    const headers: Record<string, string> = {}
    if (retryAfter) {
      const secondsLeft = Math.ceil(
        (new Date(retryAfter).getTime() - Date.now()) / 1000
      )
      headers['Retry-After'] = String(secondsLeft)
    }

    return NextResponse.json(
      { error: message, code, ...(retryAfter && { retryAfter }) },
      { status, headers }
    )
  }

  return NextResponse.json(result.data, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
