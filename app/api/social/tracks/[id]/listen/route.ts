import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import { recordListen } from '@/lib/social/listening-history'

// ============================================================
// POST /api/social/tracks/[id]/listen — registra escuta no histórico
// (V3 Plano 17). Só logado — chamado pelo player após ~10s tocando.
// ============================================================

export const POST = withAuth(async (_request: NextRequest, auth, params) => {
  const trackId = params?.id
  if (!trackId) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true, published: true },
  })
  if (!track?.published) {
    return apiError('Faixa não encontrada', 404, 'NOT_FOUND')
  }

  await recordListen(auth.userId, trackId)
  return apiSuccess({ ok: true })
})
