import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { submitTrack, submitTrackSchema, listMySubmissions } from '@/lib/tracks/artist-queries'

// ============================================================
// GET /api/musicas/upload — lista os envios do próprio artista
// ============================================================

export const GET = withRole('ARTIST', async (_req: NextRequest, auth) => {
  const tracks = await listMySubmissions(auth.userId)

  return apiSuccess({
    tracks: tracks.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      publishedAt: t.publishedAt?.toISOString() ?? null,
    })),
  })
})

// ============================================================
// POST /api/musicas/upload — artista envia uma nova música
// Sempre criada como rascunho (published: false), aguardando
// moderação do admin antes de aparecer no catálogo público.
// ============================================================

export const POST = withRole('ARTIST', async (request: NextRequest, auth) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = submitTrackSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  try {
    const track = await submitTrack(parsed.data, auth.userId)
    return apiSuccess({ track }, 201)
  } catch (err) {
    console.error('[API /musicas/upload POST]', err)
    return apiError('Erro ao enviar música', 500, 'CREATE_ERROR')
  }
})
