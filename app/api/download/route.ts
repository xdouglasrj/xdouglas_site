import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { processDownload } from '@/lib/downloads/service'
import { withRole } from '@/lib/auth/guard'

// ============================================================
// Validação de input
// ============================================================

const downloadSchema = z.object({
  trackId: z.string().uuid('trackId deve ser um UUID válido'),
})

// ============================================================
// POST /api/download
//
// Exige conta MEMBER ou superior — ouvintes (role GUEST) podem
// ouvir a faixa (/api/stream), mas não baixar o arquivo.
//
// Fluxo:
//   1. Valida body { trackId }
//   2. Extrai IP, UA, geo do request
//   3. Rate limit + bot check
//   4. Valida track (existe? publicada?)
//   5. Gera URL assinada R2 (TTL 15min)
//   6. Persiste Download + incrementa contador
//   7. Dispara DOWNLOAD_START em analytics
//   8. Retorna { downloadUrl, expiresAt, downloadId }
//
// O audioKey NUNCA é exposto — apenas a downloadUrl temporária.
// ============================================================

export const POST = withRole('MEMBER', async (request: NextRequest): Promise<NextResponse> => {
  // 1. Valida body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Body inválido', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  const parsed = downloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'trackId inválido',
        code: 'VALIDATION_ERROR',
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { trackId } = parsed.data

  // 2–8. Delega ao service
  const result = await processDownload(trackId, request)

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

  const { downloadUrl, expiresAt, downloadId, suspicious } = result.data

  // Retorna a URL assinada — client redireciona imediatamente
  return NextResponse.json(
    {
      downloadUrl,
      expiresAt,
      downloadId,
      // suspicious exposto apenas em dev para debug
      ...(process.env.NODE_ENV === 'development' && { suspicious }),
    },
    {
      // Sem cache — cada URL é única e tem TTL próprio
      headers: {
        'Cache-Control': 'no-store',
        'X-Download-Id': downloadId,
      },
    }
  )
})
