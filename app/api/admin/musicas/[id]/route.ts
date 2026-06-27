import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import {
  adminGetTrack,
  updateTrack,
  updateTrackSchema,
  togglePublish,
  deleteTrack,
} from '@/lib/tracks/admin-queries'
import { getStorage } from '@/lib/storage'
import { z } from 'zod'

// ============================================================
// GET /api/admin/musicas/[id]
// ============================================================

export const GET = withRole('ADMIN', async (_req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const track = await adminGetTrack(id)
  if (!track) return apiError('Música não encontrada', 404, 'NOT_FOUND')

  return apiSuccess({
    track: {
      ...track,
      audioSizeBytes: track.audioSizeBytes?.toString() ?? null,
    },
  })
})

// ============================================================
// PATCH /api/admin/musicas/[id]
// Suporta edição de campos e toggle de publicação
// ============================================================

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('update'), data: updateTrackSchema }),
  z.object({ action: z.literal('publish'), published: z.boolean() }),
])

export const PATCH = withRole('ADMIN', async (request: NextRequest, auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  try {
    if (parsed.data.action === 'publish') {
      const track = await togglePublish(id, parsed.data.published, auth.userId)
      return apiSuccess({ track })
    }

    const track = await updateTrack(id, parsed.data.data, auth.userId)
    return apiSuccess({ track })
  } catch (err) {
    console.error('[API PATCH /admin/musicas/[id]]', err)
    return apiError('Erro ao atualizar música', 500, 'UPDATE_ERROR')
  }
})

// ============================================================
// DELETE /api/admin/musicas/[id]
// Remove do banco E do R2 storage
// ============================================================

export const DELETE = withRole('ADMIN', async (_req: NextRequest, auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  try {
    const { audioKey, coverKey } = await deleteTrack(id, auth.userId)

    // Remove arquivos do R2 em background — não bloqueia a resposta
    const storage = getStorage()
    Promise.all([
      storage.delete(audioKey, 'private').catch((e) =>
        console.error('[R2 delete audio]', e)
      ),
      coverKey
        ? storage.delete(coverKey).catch((e) =>
            console.error('[R2 delete cover]', e)
          )
        : Promise.resolve(),
    ])

    return apiSuccess({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'Música não encontrada') {
      return apiError('Música não encontrada', 404, 'NOT_FOUND')
    }
    console.error('[API DELETE /admin/musicas/[id]]', err)
    return apiError('Erro ao remover música', 500, 'DELETE_ERROR')
  }
})
