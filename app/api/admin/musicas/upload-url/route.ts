import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { getStorage } from '@/lib/storage'
import { getUploadLimits } from '@/lib/settings/upload-limits'
import { getPlanQuotaBytes } from '@/lib/settings/plan-quotas'
import { getUserStorageUsedBytes } from '@/lib/storage/usage'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// ============================================================
// POST /api/admin/musicas/upload-url
//
// Fluxo de upload direto (browser → R2):
//   1. Artista ou admin escolhe arquivo
//   2. Frontend chama este endpoint com { filename, contentType, kind }
//   3. Backend gera presigned PUT URL (TTL 5min)
//   4. Frontend faz PUT direto para o R2
//   5. Frontend envia a storageKey ao criar/editar a música
//
// O arquivo NUNCA passa pelo servidor Next.js.
//
// Apesar do caminho /api/admin/, este endpoint também é usado pelo
// fluxo de envio do próprio artista (ArtistTrackForm) — por isso a
// role mínima é ARTIST, não ADMIN. ARTIST_SUPPORTER e ADMIN também
// passam, pois roleOrder os coloca acima de ARTIST.
// ============================================================

const ALLOWED_AUDIO = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/aiff']
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp']

const uploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  kind: z.enum(['audio', 'cover']),
  // Só relevante quando kind === 'audio' — define qual limite de
  // tamanho configurado pelo admin se aplica.
  trackType: z.enum(['music', 'podcast']).default('music'),
  sizeBytes: z.number().positive().max(2000 * 1024 * 1024), // teto absoluto de sanidade
})

export const POST = withRole('ARTIST', async (request: NextRequest, auth) => {
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

  const { filename, contentType, kind, trackType, sizeBytes } = parsed.data

  // Valida content type por tipo de arquivo
  const allowed = kind === 'audio' ? ALLOWED_AUDIO : ALLOWED_IMAGE
  if (!allowed.includes(contentType)) {
    return apiError(
      `Tipo de arquivo não permitido para ${kind}. Permitidos: ${allowed.join(', ')}`,
      400,
      'INVALID_CONTENT_TYPE'
    )
  }

  // Limite de tamanho configurável pelo admin — só para áudio
  // (a capa segue o teto absoluto de sanidade do schema)
  if (kind === 'audio') {
    const limits = await getUploadLimits()

    if (trackType === 'podcast' && !limits.podcastEnabled) {
      return apiError(
        'O upload de podcast ainda não está disponível.',
        403,
        'PODCAST_DISABLED'
      )
    }

    const maxMb = trackType === 'podcast' ? limits.podcastMaxSizeMb : limits.musicMaxSizeMb
    const maxBytes = maxMb * 1024 * 1024
    if (sizeBytes > maxBytes) {
      return apiError(
        `Arquivo muito grande. Limite atual para ${trackType === 'podcast' ? 'podcast' : 'música'}: ${maxMb}MB.`,
        400,
        'FILE_TOO_LARGE'
      )
    }

    // Cota de armazenamento por plano — só se aplica a quem está enviando
    // a própria música (artista). O admin importando catálogo não tem cota.
    if (auth.role !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { plan: true, bonusStorageMb: true },
      })
      const plan = user?.plan ?? 'FREE'
      const quotaBytes = getPlanQuotaBytes(plan, user?.bonusStorageMb ?? 0)
      const usedBytes = await getUserStorageUsedBytes(auth.userId)

      if (usedBytes + sizeBytes > quotaBytes) {
        const quotaMb = Math.round(quotaBytes / (1024 * 1024))
        const usedMb = (usedBytes / (1024 * 1024)).toFixed(1)
        return apiError(
          `Espaço insuficiente no seu plano (${plan === 'PAID' ? 'pago' : 'grátis'}). Usado: ${usedMb}MB de ${quotaMb}MB.`,
          400,
          'QUOTA_EXCEEDED'
        )
      }
    }
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
      },
      // Áudio fica no bucket privado (só acessível via URL assinada);
      // capa fica no bucket público, servida direto.
      kind === 'audio' ? 'private' : 'public'
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
