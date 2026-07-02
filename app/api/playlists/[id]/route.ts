import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

const patchPlaylistSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
})

// ============================================================
// GET /api/playlists/[id] — playlist com faixas (só o dono acessa)
// ============================================================

export const GET = withAuth(async (_request: NextRequest, auth, params) => {
  const id = params?.id
  if (!id) return apiError('Playlist não encontrada', 404, 'NOT_FOUND')

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      tracks: {
        orderBy: { position: 'asc' },
        include: {
          track: {
            select: {
              id: true, slug: true, title: true, coverUrl: true, genre: true,
              artist: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  })

  if (!playlist || playlist.userId !== auth.userId) {
    return apiError('Playlist não encontrada', 404, 'NOT_FOUND')
  }

  return apiSuccess({
    playlist: {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      isPublic: playlist.isPublic,
      tracks: playlist.tracks.map((pt) => ({
        id: pt.track.id,
        slug: pt.track.slug,
        title: pt.track.title,
        coverUrl: pt.track.coverUrl,
        genre: pt.track.genre,
        artistName: pt.track.artist.name,
        position: pt.position,
      })),
    },
  })
})

// ============================================================
// PATCH /api/playlists/[id] — edita nome/descrição/visibilidade
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

  const parsed = patchPlaylistSchema.safeParse(body)
  if (!parsed.success) return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')

  const updated = await prisma.playlist.update({
    where: { id },
    data: parsed.data,
  })

  return apiSuccess({ playlist: updated })
})

// ============================================================
// DELETE /api/playlists/[id] — exclui a playlist (e suas faixas)
// ============================================================

export const DELETE = withAuth(async (_request: NextRequest, auth, params) => {
  const id = params?.id
  if (!id) return apiError('Playlist não encontrada', 404, 'NOT_FOUND')

  const playlist = await prisma.playlist.findUnique({ where: { id } })
  if (!playlist || playlist.userId !== auth.userId) {
    return apiError('Playlist não encontrada', 404, 'NOT_FOUND')
  }

  await prisma.playlist.delete({ where: { id } })

  return apiSuccess({ ok: true })
})
