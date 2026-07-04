import { prisma } from '@/lib/prisma'
import { spendPointsWithEffect, InsufficientPointsError, getSpendableBalance } from '@/lib/points/points-service'
import {
  HIGHLIGHT_COST_POINTS,
  HIGHLIGHT_DURATION_HOURS,
  HIGHLIGHT_MAX_ACTIVE_PER_TRACK,
  HIGHLIGHT_MAX_ACTIVE_PER_USER,
} from '@/lib/points/constants'

// ============================================================
// V3 Plano 13 — Destaque de faixa gastando pontos ("Highlight").
//
// REUSO deliberado: o débito de pontos NÃO é reinventado aqui. Usa
// spendPointsWithEffect(), que carrega a MESMA checagem de saldo
// transacional de spendPoints() (a mesma que a loja usa) — saldo é
// somado dentro do `$transaction` e só debita se `current >= amount`,
// então nunca fica negativo. O registro TrackHighlight, o UPDATE de
// Track.featuredUntil e o INSERT em PointsHistory acontecem TODOS no
// mesmo `$transaction`: se qualquer passo falhar, nada é gravado —
// não debita sem destacar nem destaca sem debitar.
//
// featuredUntil é mantido em sincronia com o highlight para que o
// cleanup existente (lib/store/cleanup.ts) e qualquer leitura por
// featuredUntil continuem coerentes.
// ============================================================

export class HighlightError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export interface HighlightCostInfo {
  costPoints: number
  durationHours: number
  spendableBalance: number
  canAfford: boolean
  isOwner: boolean
  alreadyActive: boolean
  activeCountForUser: number
  maxActivePerUser: number
}

/** Info para a UI de confirmação (saldo, custo, elegibilidade). Não debita. */
export async function getHighlightCostInfo(trackId: string, userId: string): Promise<HighlightCostInfo> {
  const now = new Date()
  const [track, spendableBalance, alreadyActiveCount, activeCountForUser] = await Promise.all([
    prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true, submittedById: true, artist: { select: { userId: true } } },
    }),
    getSpendableBalance(userId),
    prisma.trackHighlight.count({ where: { trackId, canceledAt: null, endsAt: { gt: now } } }),
    prisma.trackHighlight.count({ where: { userId, canceledAt: null, endsAt: { gt: now } } }),
  ])

  const ownerUserId = track?.submittedById ?? track?.artist?.userId ?? null
  const isOwner = !!track && ownerUserId === userId

  return {
    costPoints: HIGHLIGHT_COST_POINTS,
    durationHours: HIGHLIGHT_DURATION_HOURS,
    spendableBalance,
    canAfford: spendableBalance >= HIGHLIGHT_COST_POINTS,
    isOwner,
    alreadyActive: alreadyActiveCount > 0,
    activeCountForUser,
    maxActivePerUser: HIGHLIGHT_MAX_ACTIVE_PER_USER,
  }
}

/**
 * Compra o destaque: debita os pontos e cria o TrackHighlight na MESMA
 * transação. Idempotência/corrida: a checagem de "já tem destaque ativo"
 * e a de saldo rodam DENTRO do `$transaction`; se dois cliques chegarem
 * juntos, o segundo revê o estado já gravado pelo primeiro e falha
 * (SLOTS/ALREADY_ACTIVE ou saldo insuficiente) em vez de cobrar 2x.
 */
export async function highlightTrack(trackId: string, userId: string) {
  const now = new Date()

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: {
      id: true,
      title: true,
      published: true,
      submittedById: true,
      artist: { select: { userId: true } },
    },
  })
  if (!track) throw new HighlightError('NOT_FOUND', 'Faixa não encontrada')

  const ownerUserId = track.submittedById ?? track.artist?.userId ?? null
  if (ownerUserId !== userId) {
    throw new HighlightError('NOT_OWNER', 'Você só pode destacar as suas próprias faixas')
  }
  if (!track.published) {
    throw new HighlightError('NOT_PUBLISHED', 'A faixa precisa estar publicada para ser destacada')
  }

  const endsAt = new Date(now.getTime() + HIGHLIGHT_DURATION_HOURS * 60 * 60 * 1000)

  try {
    const { remainingBalance, effect } = await spendPointsWithEffect(
      userId,
      HIGHLIGHT_COST_POINTS,
      'HIGHLIGHT_TRACK',
      async (tx) => {
        // Anti-spam DENTRO da transação (fecha a janela de corrida)
        const activeForTrack = await tx.trackHighlight.count({
          where: { trackId, canceledAt: null, endsAt: { gt: now } },
        })
        if (activeForTrack >= HIGHLIGHT_MAX_ACTIVE_PER_TRACK) {
          throw new HighlightError('ALREADY_ACTIVE', 'Esta faixa já está em destaque agora')
        }

        const activeForUser = await tx.trackHighlight.count({
          where: { userId, canceledAt: null, endsAt: { gt: now } },
        })
        if (activeForUser >= HIGHLIGHT_MAX_ACTIVE_PER_USER) {
          throw new HighlightError(
            'USER_LIMIT',
            `Você já tem ${HIGHLIGHT_MAX_ACTIVE_PER_USER} faixas em destaque ao mesmo tempo`
          )
        }

        const highlight = await tx.trackHighlight.create({
          data: { trackId, userId, costPoints: HIGHLIGHT_COST_POINTS, startsAt: now, endsAt },
        })

        // Mantém featuredUntil coerente (cleanup + leituras existentes).
        // Só estende, nunca encurta um destaque editorial já mais longo.
        await tx.track.updateMany({
          where: { id: trackId, OR: [{ featuredUntil: null }, { featuredUntil: { lt: endsAt } }] },
          data: { featuredUntil: endsAt },
        })

        return highlight
      },
      `Destaque da faixa "${track.title}" por ${HIGHLIGHT_DURATION_HOURS}h`
    )

    return { highlight: effect, remainingBalance }
  } catch (err) {
    if (err instanceof InsufficientPointsError) {
      throw new HighlightError('INSUFFICIENT_POINTS', 'Saldo de pontos insuficiente para destacar')
    }
    throw err
  }
}

/**
 * Cancelamento pelo admin com estorno (moderação). Encurta endsAt para
 * "agora", marca canceledAt e devolve os pontos (crédito ADMIN_ADJUSTMENT)
 * na MESMA transação. Idempotente: cancelar de novo não estorna 2x.
 */
export async function cancelHighlightWithRefund(highlightId: string) {
  return prisma.$transaction(async (tx) => {
    const highlight = await tx.trackHighlight.findUnique({
      where: { id: highlightId },
      include: { track: { select: { id: true, title: true } } },
    })
    if (!highlight) throw new HighlightError('NOT_FOUND', 'Destaque não encontrado')
    if (highlight.canceledAt) {
      throw new HighlightError('ALREADY_CANCELED', 'Este destaque já foi cancelado')
    }

    const now = new Date()

    await tx.trackHighlight.update({
      where: { id: highlightId },
      data: { canceledAt: now, endsAt: now },
    })

    // Estorno como crédito (ADMIN_ADJUSTMENT positivo — não mexe em totalXp)
    await tx.pointsHistory.create({
      data: {
        userId: highlight.userId,
        action: 'ADMIN_ADJUSTMENT',
        points: highlight.costPoints,
        description: `Estorno do destaque da faixa "${highlight.track.title}" (cancelado pela moderação)`,
      },
    })

    // Se nenhum outro destaque ativo cobre a faixa, limpa featuredUntil.
    const stillActive = await tx.trackHighlight.count({
      where: { trackId: highlight.trackId, canceledAt: null, endsAt: { gt: now } },
    })
    if (stillActive === 0) {
      await tx.track.updateMany({
        where: { id: highlight.trackId, featuredUntil: { lte: highlight.endsAt } },
        data: { featuredUntil: null },
      })
    }

    return { refunded: highlight.costPoints, userId: highlight.userId }
  })
}
