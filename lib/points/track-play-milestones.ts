import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications/notifications'
import { awardMilestoneOnce } from './milestones'
import { TRACK_PLAY_MILESTONES } from '@/lib/gamification'

/**
 * Checa se a faixa cruzou algum marco de plays (250/1.000/10.000) e, se
 * sim, credita pontos ao DONO da faixa (uma única vez por marco, via
 * MilestoneAward) + notifica. Chamado a partir do próprio endpoint de
 * play-complete autenticado — sem cron, sem job separado (mais simples e
 * suficiente, já que plays de usuário anônimo/deslogado não geram XP de
 * qualquer forma e o volume de faixas é pequeno o bastante para não pesar
 * fazer isso inline).
 *
 * Anti-abuso: plays do próprio artista na própria faixa não contam para o
 * total do marco (usa AnalyticsEvent, que não sabe quem ouviu — por isso o
 * chamador só invoca esta função quando o ouvinte autenticado NÃO é o dono
 * da faixa).
 */
export async function checkTrackPlayMilestones(trackId: string): Promise<void> {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true, title: true, slug: true, artist: { select: { userId: true } } },
  })
  const ownerId = track?.artist?.userId
  if (!track || !ownerId) return

  const totalPlays = await prisma.analyticsEvent.count({
    where: { trackId, eventType: 'PLAY_COMPLETE' },
  })

  // Do maior para o menor: se pulou direto de <250 para >10000 (raro, mas
  // possível com replay de eventos), credita todos os marcos elegíveis.
  for (const milestone of TRACK_PLAY_MILESTONES) {
    if (totalPlays < milestone.threshold) continue

    const { awarded } = await awardMilestoneOnce(ownerId, milestone.kind, milestone.action, trackId)
    if (!awarded) continue

    await createNotification({
      userId: ownerId,
      type: 'marco_plays',
      payload: {
        trackTitle: track.title,
        trackSlug: track.slug,
        milestonePlays: milestone.threshold,
      },
    }).catch((err) => console.error('[TrackPlayMilestone] Falha ao notificar', err))
  }
}
