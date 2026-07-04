import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/guard'
import { addPoints } from '@/lib/points/points-service'
import { checkTrackPlayMilestones } from '@/lib/points/track-play-milestones'

// ============================================================
// POST /api/social/tracks/[id]/play-complete
// Pontua TRACK_PLAYED (ação central do ouvinte no app de música) quando
// a faixa é ouvida até o fim. Separado do pipeline de analytics
// (PLAY_COMPLETE em AnalyticsEvent), que é anônimo e não tem userId —
// este endpoint é autenticado especificamente para gamificação.
// ============================================================

export const POST = withAuth(
  async (_request: NextRequest, auth, params): Promise<NextResponse> => {
    const trackId = params?.id
    if (!trackId) {
      return NextResponse.json({ error: 'Faixa não informada', code: 'MISSING_ID' }, { status: 400 })
    }

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true, published: true, artist: { select: { userId: true } } },
    })
    if (!track?.published) {
      return NextResponse.json({ error: 'Faixa não encontrada', code: 'NOT_FOUND' }, { status: 404 })
    }

    const result = await addPoints(auth.userId, 'TRACK_PLAYED')

    // V3 Plano 7 — marcos de plays do artista (250/1.000/10.000). Anti-abuso:
    // plays do próprio artista na própria faixa não contam para o marco.
    const isOwnTrack = track.artist?.userId === auth.userId
    if (!isOwnTrack) {
      checkTrackPlayMilestones(trackId).catch((err) =>
        console.error('[PlayComplete] Falha ao checar marcos de plays', err)
      )
    }

    return NextResponse.json({ ok: true, awarded: result.awarded, totalXp: result.totalXp })
  }
)
