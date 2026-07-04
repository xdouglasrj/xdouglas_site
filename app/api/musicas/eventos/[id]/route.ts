import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import { eventInputSchema, updateArtistEvent, deleteArtistEvent } from '@/lib/events/events'

// ============================================================
// PUT/DELETE /api/musicas/eventos/[id] — artista edita/exclui SÓ os
// PRÓPRIOS eventos. POSSE verificada no servidor: busca o evento e
// confirma que artistId pertence ao usuário autenticado antes de mutar.
// ============================================================

async function assertOwnership(eventId: string, userId: string) {
  const event = await prisma.artistEvent.findUnique({
    where: { id: eventId },
    select: { id: true, artist: { select: { userId: true } } },
  })
  if (!event) return { ok: false as const, status: 404, message: 'Evento não encontrado' }
  if (event.artist.userId !== userId) return { ok: false as const, status: 403, message: 'Acesso negado' }
  return { ok: true as const }
}

const updateSchema = eventInputSchema.partial()

export const PUT = withRole('GUEST', async (request: NextRequest, auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const ownership = await assertOwnership(id, auth.userId)
  if (!ownership.ok) return apiError(ownership.message, ownership.status, 'FORBIDDEN')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const event = await updateArtistEvent(id, parsed.data)
  return apiSuccess({ event })
})

export const DELETE = withRole('GUEST', async (_req: NextRequest, auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const ownership = await assertOwnership(id, auth.userId)
  if (!ownership.ok) return apiError(ownership.message, ownership.status, 'FORBIDDEN')

  await deleteArtistEvent(id)
  return apiSuccess({ ok: true })
})
