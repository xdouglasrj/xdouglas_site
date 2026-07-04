import { PointActionType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { addPoints } from './points-service'

/**
 * Credita um marco (milestone) de forma IDEMPOTENTE: usa a constraint única
 * @@unique([userId, kind, refId]) de MilestoneAward como trava — se já
 * existe, não credita de novo (não dá pra farmar rodando a mesma checagem
 * várias vezes). Cria o registro ANTES de chamar addPoints: se
 * addPoints falhar, o unique já impediu a criação duplicada de qualquer
 * forma (o insert falharia com P2002), então a ordem aqui prioriza nunca
 * pagar 2x em vez de nunca perder 1 pagamento em caso de erro raro.
 */
export async function awardMilestoneOnce(
  userId: string,
  kind: string,
  action: PointActionType,
  refId: string = ''
): Promise<{ awarded: boolean; points: number }> {
  try {
    await prisma.milestoneAward.create({
      data: { userId, kind, refId },
    })
  } catch (err) {
    // P2002 = violação de unique constraint — marco já foi pago antes
    if (isUniqueViolation(err)) {
      return { awarded: false, points: 0 }
    }
    throw err
  }

  const result = await addPoints(userId, action)
  return { awarded: result.awarded > 0, points: result.awarded }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  )
}
