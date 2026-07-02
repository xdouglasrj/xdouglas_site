import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/guard'
import { isFeatureEnabled } from '@/lib/settings/feature-flags'
import { addPoints } from '@/lib/points/points-service'

// ============================================================
// POST /api/social/tracks/[id]/share
// Registra que o usuário compartilhou a faixa — pontua TRACK_SHARED,
// com teto diário aplicado pelo PointsService. Não há estado persistido
// de "compartilhamento" em si (diferente de curtida/comentário), é só
// o gatilho de pontos do clique no botão de compartilhar.
// ============================================================

export const POST = withAuth(
  async (_request: NextRequest, auth, params): Promise<NextResponse> => {
    const trackId = params?.id
    if (!trackId) {
      return NextResponse.json({ error: 'Faixa não informada', code: 'MISSING_ID' }, { status: 400 })
    }

    const track = await prisma.track.findUnique({ where: { id: trackId }, select: { id: true } })
    if (!track) {
      return NextResponse.json({ error: 'Faixa não encontrada', code: 'NOT_FOUND' }, { status: 404 })
    }

    if (!(await isFeatureEnabled('compartilhar'))) {
      return NextResponse.json({ error: 'Compartilhar está desativado no momento', code: 'FEATURE_DISABLED' }, { status: 403 })
    }

    const result = await addPoints(auth.userId, 'TRACK_SHARED')

    return NextResponse.json({ ok: true, awarded: result.awarded, totalXp: result.totalXp })
  }
)
