import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { getStorage } from '@/lib/storage'
import crypto from 'crypto'

// ============================================================
// POST /api/admin/contests/upload-url
//
// Presigned URL para os arquivos de um Contest: capa (imagem) e stems
// (zip). Segue o mesmo fluxo de /api/admin/musicas/upload-url (browser
// → R2 direto, arquivo nunca passa pelo servidor Next.js), mas ADMIN-only
// — só o admin cria/edita contests nesta v1 (ver Plano 6).
// ============================================================

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_ZIP = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
const MAX_STEMS_SIZE_BYTES = 500 * 1024 * 1024 // 500MB — pacote de stems

const uploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  kind: z.enum(['cover', 'stems']),
  sizeBytes: z.number().positive().max(2000 * 1024 * 1024),
})

export const POST = withRole('ADMIN', async (request: NextRequest) => {
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

  if (kind === 'cover') {
    if (!ALLOWED_IMAGE.includes(contentType)) {
      return apiError(
        `Tipo de arquivo não permitido para capa. Permitidos: ${ALLOWED_IMAGE.join(', ')}`,
        400,
        'INVALID_CONTENT_TYPE'
      )
    }
  } else {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext !== 'zip' || !ALLOWED_ZIP.includes(contentType)) {
      return apiError('Stems precisam ser um arquivo .zip', 400, 'INVALID_CONTENT_TYPE')
    }
    if (sizeBytes > MAX_STEMS_SIZE_BYTES) {
      return apiError(
        `Arquivo de stems muito grande. Limite: ${MAX_STEMS_SIZE_BYTES / (1024 * 1024)}MB.`,
        400,
        'FILE_TOO_LARGE'
      )
    }
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const uniqueId = crypto.randomUUID()
  const prefix = kind === 'cover' ? 'covers' : 'contests/stems'
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
          'uploaded-by': 'xdouglas-admin-contests',
        },
      },
      // Capa fica pública (servida direto); stems ficam privados (mesmo
      // padrão de áudio) — download passa por URL assinada de curta duração.
      kind === 'cover' ? 'public' : 'private'
    )

    return apiSuccess({
      uploadUrl,
      storageKey,
      publicUrl: kind === 'cover' ? storage.getPublicUrl(storageKey) : undefined,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (err) {
    console.error('[admin/contests/upload-url]', err)
    return apiError('Erro ao gerar URL de upload', 500, 'STORAGE_ERROR')
  }
})
