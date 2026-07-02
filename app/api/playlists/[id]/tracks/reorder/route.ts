import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

const reorderSchema = z.object({
  tracks: z.array(z.object({ trackId: z.string().min(1), position: z.number().int().min(0) })).min(1),
})

// ============================================================
// PATCH /api/playlists/[id]/tracks/reorder — atualiza a posição de
// várias faixas de uma vez (drag-and-drop ou setas de mover)
// ============================================================

export const PATCH = withAuth(async (request: NextRequest, auth, params) => {
  const id = params?.id
  if (!id) return apiError('Playlist não encontrada', 404, 'NOT_FOUND')

  const playlist = await prisma.playlist.findUnique({ where: { id } })
  if (!playlist || playlist.userId !== auth.userId) {
    return apiError('Playlist não encontrada', 404, 'NOT_FOUND')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = reorderSchema.safeParse(body)
  if (!parsed.success) return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')

  await prisma.$transaction(
    parsed.data.tracks.map(({ trackId, position }) =>
      prisma.playlistTrack.updateMany({
        where: { playlistId: id, trackId },
        data: { position },
      })
    )
  )

  return apiSuccess({ ok: true })
})
