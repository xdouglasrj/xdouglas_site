import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { isFeatureEnabled } from '@/lib/settings/feature-flags'
import { prisma } from '@/lib/prisma'
import { addPoints } from '@/lib/points/points-service'

const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(120),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
})

// ============================================================
// GET /api/playlists — playlists do usuário logado
// ============================================================

export const GET = withAuth(async (_request: NextRequest, auth) => {
  const playlists = await prisma.playlist.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { tracks: true } },
      tracks: {
        orderBy: { position: 'asc' },
        take: 4,
        select: { track: { select: { coverUrl: true } } },
      },
    },
  })

  return apiSuccess({
    playlists: playlists.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isPublic: p.isPublic,
      trackCount: p._count.tracks,
      coverUrls: p.tracks.map((t) => t.track.coverUrl).filter(Boolean),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  })
})

// ============================================================
// POST /api/playlists — cria playlist nova
// ============================================================

export const POST = withAuth(async (request: NextRequest, auth) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = createPlaylistSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  if (!(await isFeatureEnabled('playlist'))) {
    return apiError('Playlists estão desativadas no momento', 403, 'FEATURE_DISABLED')
  }

  const playlist = await prisma.playlist.create({
    data: {
      userId: auth.userId,
      name: parsed.data.name,
      description: parsed.data.description,
      isPublic: parsed.data.isPublic ?? false,
    },
  })

  addPoints(auth.userId, 'PLAYLIST_CREATED').catch((err) =>
    console.error('[API /playlists POST] Falha ao registrar pontos', err)
  )

  return apiSuccess({ playlist }, 201)
})
