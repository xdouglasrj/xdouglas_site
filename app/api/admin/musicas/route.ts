import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/auth/guard'
import { withPermission } from '@/lib/auth/permissions'
import { adminListTracks, createTrack, createTrackSchema } from '@/lib/tracks/admin-queries'

// ============================================================
// GET /api/admin/musicas — listagem completa para o admin
// ============================================================

export const GET = withPermission('musicas.moderar', async () => {
  const tracks = await adminListTracks()

  // Serializa BigInt e Date
  const serialized = tracks.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    publishedAt: t.publishedAt?.toISOString() ?? null,
  }))

  return apiSuccess({ tracks: serialized })
})

// ============================================================
// POST /api/admin/musicas — cria nova música
// ============================================================

export const POST = withPermission('musicas.editar', async (request: NextRequest, auth) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = createTrackSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  try {
    const track = await createTrack(parsed.data, auth.userId)
    return apiSuccess({ track }, 201)
  } catch (err) {
    console.error('[API /admin/musicas POST]', err)
    return apiError('Erro ao criar música', 500, 'CREATE_ERROR')
  }
})
