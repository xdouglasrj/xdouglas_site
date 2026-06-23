import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { getStorage } from '@/lib/storage'
import crypto from 'crypto'

// ============================================================
// POST /api/perfil/upload-url
//
// Gera presigned PUT URL para a foto de perfil — mesmo fluxo do
// upload de músicas (browser → R2 direto, servidor só assina a URL).
// ============================================================

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp']

const uploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().positive().max(5 * 1024 * 1024), // 5MB máximo
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

  if (!ALLOWED_IMAGE.includes(contentType)) {
    return apiError(
      `Tipo de arquivo não permitido. Permitidos: ${ALLOWED_IMAGE.join(', ')}`,
      400,
      'INVALID_CONTENT_TYPE'
    )
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const uniqueId = crypto.randomUUID()
  const storageKey = `avatars/${auth.userId}/${uniqueId}.${ext}`

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
      expiresAt: expiresAt.toISOString(),
    })
  } catch (err) {
    console.error('[perfil/upload-url]', err)
    return apiError('Erro ao gerar URL de upload', 500, 'STORAGE_ERROR')
  }
})
