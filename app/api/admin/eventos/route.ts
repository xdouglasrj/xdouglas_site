import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import { createArtistEvent, eventInputSchema } from '@/lib/events/events'

// ============================================================
// GET /api/admin/eventos — todos os eventos (qualquer artista), p/ moderação
// ============================================================

export const GET = withRole('ADMIN', async () => {
  const events = await prisma.artistEvent.findMany({
    orderBy: { startsAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      venue: true,
      city: true,
      startsAt: true,
      infoUrl: true,
      published: true,
      createdAt: true,
      artist: { select: { id: true, name: true, slug: true } },
    },
  })
  return apiSuccess({ events })
})

// ============================================================
// POST /api/admin/eventos — admin cria evento para qualquer artista
// ============================================================

const createSchema = eventInputSchema.extend({
  artistId: z.string().uuid('Artista obrigatório'),
})

export const POST = withRole('ADMIN', async (request: NextRequest) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const artist = await prisma.artist.findUnique({ where: { id: parsed.data.artistId }, select: { id: true } })
  if (!artist) return apiError('Artista não encontrado', 400, 'INVALID_ARTIST')

  const { artistId, ...input } = parsed.data
  const event = await createArtistEvent(artistId, input)
  return apiSuccess({ event }, 201)
})
