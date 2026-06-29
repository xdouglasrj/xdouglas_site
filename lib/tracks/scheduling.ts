import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

// ============================================================
// Regras de agendamento de lançamento
// ============================================================

export const MAX_SCHEDULE_DAYS_AHEAD = 15
export const MAX_SCHEDULED_TRACKS_PER_USER = 30

/** Janela válida pra agendar: entre agora e MAX_SCHEDULE_DAYS_AHEAD dias no futuro. */
export function isWithinScheduleWindow(date: Date): boolean {
  const now = new Date()
  const max = new Date(now.getTime() + MAX_SCHEDULE_DAYS_AHEAD * 24 * 60 * 60 * 1000)
  return date.getTime() >= now.getTime() && date.getTime() <= max.getTime()
}

export async function countActiveSchedules(userId: string): Promise<number> {
  return prisma.track.count({
    where: { submittedById: userId, scheduledAt: { not: null }, published: false },
  })
}

// ============================================================
// Publica automaticamente as músicas cujo agendamento já venceu —
// chamada de forma "oportunista" nas páginas/rotas de maior tráfego
// (já que no plano Hobby da Vercel o cron só roda 1x/dia) e também
// pelo cron diário de garantia em /api/cron/publish-scheduled.
// ============================================================

export async function publishDueScheduledTracks(): Promise<number> {
  const result = await prisma.track.updateMany({
    where: { published: false, scheduledAt: { lte: new Date() } },
    data: { published: true, publishedAt: new Date() },
  })
  return result.count
}

// ============================================================
// Link particular do artista — token fixo gerado sob demanda,
// mesmo padrão de lib/invites/code.ts
// ============================================================

function generateSchedulingToken(): string {
  const raw = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `XDAG-${raw.slice(0, 4)}-${raw.slice(4, 8)}`
}

export function normalizeSchedulingToken(token: string): string {
  return token.trim().toUpperCase()
}

export async function getOrCreateSchedulingToken(artistId: string): Promise<string> {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { schedulingToken: true },
  })
  if (artist?.schedulingToken) return artist.schedulingToken

  let token = generateSchedulingToken()
  while (await prisma.artist.findUnique({ where: { schedulingToken: token }, select: { id: true } })) {
    token = generateSchedulingToken()
  }

  await prisma.artist.update({ where: { id: artistId }, data: { schedulingToken: token } })
  return token
}
