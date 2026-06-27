import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { getStorage } from '@/lib/storage'
import crypto from 'crypto'

// ============================================================
// POST /api/support/upload-url
//
// Gera presigned PUT URL para o anexo (foto ou vídeo) de um
// chamado de suporte — mesmo fluxo do upload de avatar/músicas.
// ============================================================

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024

const uploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().positive(),
})

export const POST = withAuth(async (request: NextRequest, auth) => {
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

  const { filename, contentType, sizeBytes } = parsed.data

  const isImage = ALLOWED_IMAGE.includes(contentType)
  const isVideo = ALLOWED_VIDEO.includes(contentType)

  if (!isImage && !isVideo) {
    return apiError(
      `Tipo de arquivo não permitido. Permitidos: ${[...ALLOWED_IMAGE, ...ALLOWED_VIDEO].join(', ')}`,
      400,
      'INVALID_CONTENT_TYPE'
    )
  }

  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
  if (sizeBytes > maxBytes) {
    return apiError(
      `Arquivo muito grande. Máximo: ${Math.round(maxBytes / (1024 * 1024))}MB`,
      400,
      'FILE_TOO_LARGE'
    )
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const uniqueId = crypto.randomUUID()
  const storageKey = `support/${auth.userId}/${uniqueId}.${ext}`

  try {
    const storage = getStorage()
    const { uploadUrl, expiresAt } = await storage.getSignedUploadUrl(storageKey, {
      contentType,
      maxSizeBytes: sizeBytes,
      metadata: {
        'original-filename': encodeURIComponent(filename),
        'uploaded-by': auth.userId,
      },
    })

    return apiSuccess({
      uploadUrl,
      storageKey,
      publicUrl: storage.getPublicUrl(storageKey),
      attachmentType: isImage ? 'IMAGE' : 'VIDEO',
      expiresAt: expiresAt.toISOString(),
    })
  } catch (err) {
    console.error('[support/upload-url]', err)
    return apiError('Erro ao gerar URL de upload', 500, 'STORAGE_ERROR')
  }
})
