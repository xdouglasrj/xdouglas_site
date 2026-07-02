import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

// ============================================================
// DELETE /api/playlists/[id]/tracks/[trackId] — remove faixa da playlist
// ============================================================

export const DELETE = withAuth(async (_request: NextRequest, auth, params) => {
  const id = params?.id
  const trackId = params?.trackId
  if (!id || !trackId) return apiError('Playlist não encontrada', 404, 'NOT_FOUND')

  const playlist = await prisma.playlist.findUnique({ where: { id } })
  if (!playlist || playlist.userId !== auth.userId) {
    return apiError('Playlist não encontrada', 404, 'NOT_FOUND')
  }

  await prisma.playlistTrack.deleteMany({ where: { playlistId: id, trackId } })

  return apiSuccess({ ok: true })
})
