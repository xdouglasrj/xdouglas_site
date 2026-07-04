import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import { getPlaybackProgress, savePlaybackProgress } from '@/lib/social/playback-progress'

// ============================================================
// GET /api/social/tracks/[id]/progress — progresso salvo (retomar)
// PUT /api/social/tracks/[id]/progress — grava progresso (throttle 10s)
// (V3 Plano 11 — retomar de onde parou, só para logados)
// ============================================================

// Throttle em memória por processo — best-effort, evita gravação em toda
// requisição em rajada; a gravação "de verdade" (LRU/persistência) não
// precisa de mais que isso porque o client já espaça as chamadas em ~15s.
const lastWriteAt = new Map<string, number>()
const THROTTLE_MS = 10_000

export const GET = withAuth(async (_request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const positionSeconds = await getPlaybackProgress(trackId, auth.userId)
  return apiSuccess({ positionSeconds })
})

export const PUT = withAuth(async (request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const throttleKey = `${auth.userId}:${trackId}`
  const now = Date.now()
  const last = lastWriteAt.get(throttleKey)
  if (last && now - last < THROTTLE_MS) {
    return apiSuccess({ throttled: true })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Corpo inválido', 400, 'INVALID_BODY')
  }

  const positionSeconds = (body as { positionSeconds?: unknown })?.positionSeconds
  if (typeof positionSeconds !== 'number' || !isFinite(positionSeconds) || positionSeconds < 0) {
    return apiError('positionSeconds inválido', 400, 'INVALID_POSITION')
  }

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true, published: true, durationSeconds: true },
  })
  if (!track?.published) {
    return apiError('Faixa não encontrada', 404, 'NOT_FOUND')
  }

  lastWriteAt.set(throttleKey, now)

  const result = await savePlaybackProgress(
    trackId,
    auth.userId,
    positionSeconds,
    track.durationSeconds
  )
  return apiSuccess({ ok: true, completed: result.completed })
})
