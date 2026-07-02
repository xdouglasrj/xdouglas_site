import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { isFeatureEnabled } from '@/lib/settings/feature-flags'
import { submitTrack, submitTrackSchema, listMySubmissions } from '@/lib/tracks/artist-queries'

// ============================================================
// GET /api/musicas/upload — lista os envios do próprio artista
// ============================================================

// withRole('GUEST', ...) — qualquer usuário autenticado pode enviar música,
// independente do role (upload liberado a todos, ver MAPA-E-PLANO §3.7)
export const GET = withRole('GUEST', async (_req: NextRequest, auth) => {
  const tracks = await listMySubmissions(auth.userId)

  return apiSuccess({
    tracks: tracks.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      publishedAt: t.publishedAt?.toISOString() ?? null,
      scheduledAt: t.scheduledAt?.toISOString() ?? null,
    })),
  })
})

// ============================================================
// POST /api/musicas/upload — artista envia uma nova música
// Sempre criada como rascunho (published: false), aguardando
// moderação do admin antes de aparecer no catálogo público.
// ============================================================

export const POST = withRole('GUEST', async (request: NextRequest, auth) => {
  if (!(await isFeatureEnabled('upload'))) {
    return apiError('Upload de músicas está desativado no momento', 403, 'FEATURE_DISABLED')
  }

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
    return apiSuccess({ track: { ...track, scheduledAt: track.scheduledAt?.toISOString() ?? null } }, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.startsWith('Data de agendamento') || message.startsWith('Limite de')) {
      return apiError(message, 400, 'SCHEDULE_ERROR')
    }
    console.error('[API /musicas/upload POST]', err)
    return apiError('Erro ao enviar música', 500, 'CREATE_ERROR')
  }
})
