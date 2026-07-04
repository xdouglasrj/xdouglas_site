import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import { createArtistEvent, eventInputSchema, listEventsByArtistForManagement } from '@/lib/events/events'

// ============================================================
// GET /api/musicas/eventos — lista os eventos do próprio artista
// Mesma regra de permissão do upload (withRole('GUEST') — qualquer
// usuário autenticado com perfil de artista pode gerenciar seus eventos).
// ============================================================

export const GET = withRole('GUEST', async (_req: NextRequest, auth) => {
  const artist = await prisma.artist.findUnique({ where: { userId: auth.userId }, select: { id: true } })
  if (!artist) return apiSuccess({ events: [] })

  const events = await listEventsByArtistForManagement(artist.id)
  return apiSuccess({
    events: events.map((e) => ({ ...e, startsAt: e.startsAt.toISOString(), createdAt: e.createdAt.toISOString() })),
  })
})

// ============================================================
// POST /api/musicas/eventos — artista cria evento para SI MESMO
// POSSE: o artistId é sempre derivado de auth.userId no servidor, nunca
// aceito do body — impossível criar evento em nome de outro artista.
// ============================================================

export const POST = withRole('GUEST', async (request: NextRequest, auth) => {
  const artist = await prisma.artist.findUnique({ where: { userId: auth.userId }, select: { id: true } })
  if (!artist) return apiError('Você ainda não tem um perfil de artista', 403, 'NO_ARTIST_PROFILE')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = eventInputSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const event = await createArtistEvent(artist.id, parsed.data)
  return apiSuccess({ event }, 201)
})
