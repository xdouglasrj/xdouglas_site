import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { getStorage } from '@/lib/storage'
import crypto from 'crypto'

// ============================================================
// POST /api/admin/musicas/upload-url
//
// Fluxo de upload direto (browser → R2):
//   1. Admin escolhe arquivo
//   2. Frontend chama este endpoint com { filename, contentType, kind }
//   3. Backend gera presigned PUT URL (TTL 5min)
//   4. Frontend faz PUT direto para o R2
//   5. Frontend envia a storageKey ao criar/editar a música
//
// O arquivo NUNCA passa pelo servidor Next.js.
// ============================================================

const ALLOWED_AUDIO = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/aiff']
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp']

const uploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  kind: z.enum(['audio', 'cover']),
  sizeBytes: z.number().positive().max(500 * 1024 * 1024), // 500MB máximo
})

export const POST = withAuth(async (request: NextRequest) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = uploadUrlSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const { filename, contentType, kind, sizeBytes } = parsed.data

  // Valida content type por tipo de arquivo
  const allowed = kind === 'audio' ? ALLOWED_AUDIO : ALLOWED_IMAGE
  if (!allowed.includes(contentType)) {
    return apiError(
      `Tipo de arquivo não permitido para ${kind}. Permitidos: ${allowed.join(', ')}`,
      400,
      'INVALID_CONTENT_TYPE'
    )
  }

  // Gera chave única no R2 com UUID para evitar colisões e path traversal
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const uniqueId = crypto.randomUUID()
  const prefix = kind === 'audio' ? 'audio' : 'covers'
  const storageKey = `${prefix}/${uniqueId}.${ext}`

  try {
    const storage = getStorage()
    const { uploadUrl, expiresAt } = await storage.getSignedUploadUrl(
      storageKey,
      {
        contentType,
        maxSizeBytes: sizeBytes,
        metadata: {
          'original-filename': encodeURIComponent(filename),
          'uploaded-by': 'xdouglas-admin',
        },
      }
    )

    return apiSuccess({
      uploadUrl,
      storageKey,
      publicUrl:
        kind === 'cover' ? storage.getPublicUrl(storageKey) : undefined,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (err) {
    console.error('[upload-url]', err)
    return apiError('Erro ao gerar URL de upload', 500, 'STORAGE_ERROR')
  }
})
