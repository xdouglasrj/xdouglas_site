import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

const addTrackSchema = z.object({
  trackId: z.string().min(1),
})

// ============================================================
// POST /api/playlists/[id]/tracks — adiciona faixa ao fim da playlist
// ============================================================

export const POST = withAuth(async (request: NextRequest, auth, params) => {
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

  const parsed = addTrackSchema.safeParse(body)
  if (!parsed.success) return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')

  const track = await prisma.track.findUnique({ where: { id: parsed.data.trackId }, select: { id: true } })
  if (!track) return apiError('Música não encontrada', 404, 'TRACK_NOT_FOUND')

  const existing = await prisma.playlistTrack.findUnique({
    where: { playlistId_trackId: { playlistId: id, trackId: parsed.data.trackId } },
  })
  if (existing) return apiError('Música já está na playlist', 409, 'ALREADY_ADDED')

  const last = await prisma.playlistTrack.findFirst({
    where: { playlistId: id },
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  const playlistTrack = await prisma.playlistTrack.create({
    data: {
      playlistId: id,
      trackId: parsed.data.trackId,
      position: (last?.position ?? -1) + 1,
    },
  })

  await prisma.playlist.update({ where: { id }, data: { updatedAt: new Date() } })

  return apiSuccess({ playlistTrack }, 201)
})
