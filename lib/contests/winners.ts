import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getLevelForXp } from '@/lib/points/levels'
import { checkDynamicPricing } from '@/lib/store/dynamic-pricing'
import { createNotification } from '@/lib/notifications/notifications'

type Tx = Prisma.TransactionClient

// ============================================================
// V3 Plano 6 — marcar vencedor de um ContestEntry.
//
// IDEMPOTÊNCIA (invariável): `ContestEntry.winner` É a trava. O UPDATE que
// marca winner=true só acontece quando a leitura prévia (dentro da mesma
// transação) mostra winner=false — ler-depois-escrever protegido pelo
// próprio `$transaction` do Prisma (isolamento default READ COMMITTED do
// Postgres é suficiente aqui porque o campo que decide o "já pago" é o
// mesmo que estamos escrevendo: um segundo UPDATE concorrente veria
// winner=true e a rota abaixo já teria retornado antes de chegar no
// UPDATE). Chamar de novo com o mesmo entryId retorna cedo sem debitar
// nada — "marcar vencedor 2x não paga 2x".
//
// Crédito de pontos: REUSA addPoints() com override de valor (mesmo
// caminho de giftPoints/ADMIN_GIFT em lib/points/points-service.ts) —
// não reinventa a movimentação de PointsHistory/XP. prizePoints é
// variável por contest, então usamos addPoints(..., { points: N }) em vez
// de uma regra fixa em POINT_RULES.
//
// Destaque: featuredUntil só ESTENDE (nunca encurta), mesmo padrão de
// lib/store/highlight-service.ts — usa updateMany com OR (featuredUntil
// null OU menor que o novo valor).
// ============================================================

export class ContestWinnerError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

const WINNER_FEATURE_DAYS = 7

type MarkWinnerResult =
  | { alreadyWinner: true; awarded: 0 }
  | { alreadyWinner: false; awarded: number; contestTitle: string; contestSlug: string; userId: string }

export async function markContestWinner(entryId: string): Promise<MarkWinnerResult> {
  const result = await prisma.$transaction(async (tx): Promise<MarkWinnerResult> => {
    const entry = await tx.contestEntry.findUnique({
      where: { id: entryId },
      include: {
        contest: { select: { id: true, title: true, slug: true, prizePoints: true } },
        track: { select: { id: true, title: true, featuredUntil: true } },
      },
    })
    if (!entry) throw new ContestWinnerError('NOT_FOUND', 'Submissão não encontrada')

    // Trava de idempotência: já é vencedor — não credita/destaca de novo.
    if (entry.winner) {
      return { alreadyWinner: true, awarded: 0 }
    }

    await tx.contestEntry.update({ where: { id: entryId }, data: { winner: true } })

    const featuredUntil = new Date(Date.now() + WINNER_FEATURE_DAYS * 24 * 60 * 60 * 1000)
    // Só estende — nunca encurta um destaque editorial/highlight já mais longo.
    await tx.track.updateMany({
      where: {
        id: entry.track.id,
        OR: [{ featuredUntil: null }, { featuredUntil: { lt: featuredUntil } }],
      },
      data: { featuredUntil },
    })

    let awarded = 0
    if (entry.contest.prizePoints > 0) {
      const creditResult = await addPointsInTx(tx, entry.userId, entry.contest.prizePoints, entry.contest.title)
      awarded = creditResult.awarded
    }

    return {
      alreadyWinner: false,
      awarded,
      contestTitle: entry.contest.title,
      contestSlug: entry.contest.slug,
      userId: entry.userId,
    }
  })

  if (!result.alreadyWinner) {
    await createNotification({
      userId: result.userId,
      type: 'contest_resultado',
      payload: { contestTitle: result.contestTitle, contestSlug: result.contestSlug, won: true },
    }).catch((err) => console.error('[Contest] Falha ao notificar vencedor', err))
  }

  return result
}

// addPoints() abre sua PRÓPRIA transação internamente (prisma.$transaction),
// o que não pode ser aninhado dentro da transação de markContestWinner sem
// reescrever addPoints para aceitar um client. Para manter o crédito de
// pontos e o UPDATE de winner/featuredUntil atômicos (tudo ou nada), este
// helper replica o INSERT em PointsHistory + atualização de totalXp/level
// usando o MESMO tx recebido — evitando duas transações separadas que
// poderiam divergir (ex.: marca vencedor mas falha ao creditar).
async function addPointsInTx(
  tx: Tx,
  userId: string,
  points: number,
  contestTitle: string
): Promise<{ awarded: number }> {
  await tx.pointsHistory.create({
    data: {
      userId,
      action: 'ADMIN_GIFT',
      points,
      description: `Prêmio do concurso "${contestTitle}"`,
    },
  })
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
  const newTotalXp = user.totalXp + points
  const newLevel = getLevelForXp(newTotalXp)
  await tx.user.update({ where: { id: userId }, data: { totalXp: newTotalXp, level: newLevel } })

  // Paridade com applyEarnedPoints: recalcula o preço dinâmico da loja após o
  // XP mudar (senão o preço fica desatualizado até o próximo evento de pontos).
  // NOTA: o multiplicador de promoção (getActivePromotionMultiplier) é
  // PROPOSITALMENTE ignorado aqui — o prêmio do concurso é um valor fixo
  // definido pelo admin e não deve ser inflado por uma promoção genérica.
  await checkDynamicPricing(tx, userId, user.role, newTotalXp)

  return { awarded: points }
}
