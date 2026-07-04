import { prisma } from '@/lib/prisma'
import { isContestOpen } from './contests'

// ============================================================
// V3 Plano 6 — criação de ContestEntry ao publicar/enviar uma faixa com
// contestId. TODA validação é no SERVIDOR (nunca confia no client):
//   - contest existe e está publicado
//   - deadline não passou
//   - 1 entry por usuário (a constraint @@unique([contestId, userId]) do
//     Prisma é a garantia final contra corrida — o P2002 vira "já participou")
// ============================================================

export class ContestEntryError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

/**
 * Valida se o contestId enviado no upload pode virar uma ContestEntry.
 * Lançado ANTES de criar a faixa — falha cedo, sem deixar Track órfã de
 * validação. Não cria nada; só verifica.
 */
export async function assertCanEnterContest(contestId: string, userId: string): Promise<void> {
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { id: true, published: true, deadline: true },
  })
  if (!contest) throw new ContestEntryError('NOT_FOUND', 'Concurso não encontrado')
  if (!isContestOpen(contest)) {
    throw new ContestEntryError('CLOSED', 'Este concurso está encerrado ou ainda não foi publicado')
  }

  const existing = await prisma.contestEntry.findUnique({
    where: { contestId_userId: { contestId, userId } },
    select: { id: true },
  })
  if (existing) {
    throw new ContestEntryError('ALREADY_ENTERED', 'Você já participou deste concurso')
  }
}

/**
 * Cria a ContestEntry para uma faixa recém-criada. Chamado logo após
 * `submitTrack` quando `input.contestId` está presente. Revalida tudo de
 * novo (contest aberto, ainda não participou) DENTRO da criação — fecha a
 * janela de corrida entre a checagem em assertCanEnterContest e este
 * momento (ex.: dois envios simultâneos do mesmo usuário). Se a
 * constraint única disparar (P2002), trata como "já participou" em vez
 * de vazar um erro genérico de banco.
 */
export async function createContestEntry(
  contestId: string,
  trackId: string,
  userId: string
): Promise<void> {
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { id: true, published: true, deadline: true },
  })
  if (!contest) throw new ContestEntryError('NOT_FOUND', 'Concurso não encontrado')
  if (!isContestOpen(contest)) {
    throw new ContestEntryError('CLOSED', 'Este concurso está encerrado ou ainda não foi publicado')
  }

  try {
    await prisma.contestEntry.create({
      data: { contestId, trackId, userId },
    })
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ContestEntryError('ALREADY_ENTERED', 'Você já participou deste concurso')
    }
    throw err
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  )
}
