import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createNotification } from '@/lib/notifications/notifications'

// ============================================================
// V3 Plano 6 — Contests (concursos de remix). v1: só o admin cria/edita/
// publica contests. Prêmio em pontos da loja (nunca dinheiro/cripto) +
// destaque de 7 dias na faixa vencedora (ver lib/contests/winners.ts).
// ============================================================

const REMOVE_DIACRITICS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  'g'
)

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(REMOVE_DIACRITICS, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export async function generateUniqueContestSlug(title: string): Promise<string> {
  const base = slugify(title) || 'concurso'
  let slug = base
  let attempt = 0
  while (true) {
    const existing = await prisma.contest.findUnique({ where: { slug }, select: { id: true } })
    if (!existing) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

// ============================================================
// Validação
// ============================================================

export const contestInputSchema = z.object({
  title: z.string().trim().min(1, 'Título obrigatório').max(200),
  description: z.string().trim().min(1, 'Descrição/regras obrigatórias').max(10_000),
  coverKey: z.string().max(500).optional().nullable(),
  stemsKey: z.string().max(500).optional().nullable(),
  hostArtistId: z.string().uuid().optional().nullable(),
  prizePoints: z.coerce.number().int().min(0).max(1_000_000).default(0),
  prizeText: z.string().trim().max(2000).optional().nullable(),
  deadline: z.coerce.date({ errorMap: () => ({ message: 'Deadline inválido' }) }),
  published: z.boolean().optional(),
})

export type ContestInput = z.infer<typeof contestInputSchema>

// ============================================================
// CRUD — admin
// ============================================================

export async function createContest(input: ContestInput) {
  const slug = await generateUniqueContestSlug(input.title)

  return prisma.contest.create({
    data: {
      slug,
      title: input.title,
      description: input.description,
      coverKey: input.coverKey || null,
      stemsKey: input.stemsKey || null,
      hostArtistId: input.hostArtistId || null,
      prizePoints: input.prizePoints,
      prizeText: input.prizeText || null,
      deadline: input.deadline,
      published: input.published ?? false,
    },
  })
}

export async function updateContest(contestId: string, input: Partial<ContestInput>) {
  const existing = await prisma.contest.findUnique({ where: { id: contestId } })
  if (!existing) throw new Error('Concurso não encontrado')

  const wasPublished = existing.published

  const data: Record<string, unknown> = {}
  if (input.title !== undefined) data.title = input.title
  if (input.description !== undefined) data.description = input.description
  if (input.coverKey !== undefined) data.coverKey = input.coverKey || null
  if (input.stemsKey !== undefined) data.stemsKey = input.stemsKey || null
  if (input.hostArtistId !== undefined) data.hostArtistId = input.hostArtistId || null
  if (input.prizePoints !== undefined) data.prizePoints = input.prizePoints
  if (input.prizeText !== undefined) data.prizeText = input.prizeText || null
  if (input.deadline !== undefined) data.deadline = input.deadline
  if (input.published !== undefined) data.published = input.published

  const contest = await prisma.contest.update({ where: { id: contestId }, data })

  // Notifica seguidores do artista host só na TRANSIÇÃO false -> true
  // (1 vez por contest, mesmo padrão de ArtistEvent).
  if (!wasPublished && contest.published) {
    await notifyFollowersOfNewContest(contest.id).catch((err) =>
      console.error('[Contest] Falha ao notificar seguidores', err)
    )
  }

  return contest
}

export async function deleteContest(contestId: string) {
  await prisma.contest.delete({ where: { id: contestId } })
}

// ============================================================
// Notificação — contest novo publicado, para seguidores do artista host
// ============================================================

async function notifyFollowersOfNewContest(contestId: string): Promise<void> {
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: {
      title: true,
      slug: true,
      hostArtist: { select: { userId: true, name: true } },
    },
  })
  if (!contest || !contest.hostArtist?.userId) return

  const hostUserId = contest.hostArtist.userId
  const followers = await prisma.follow.findMany({
    where: { followingId: hostUserId },
    select: { followerId: true },
  })

  const results = await Promise.allSettled(
    followers.map((f) =>
      createNotification({
        userId: f.followerId,
        actorId: hostUserId,
        type: 'contest_publicado',
        payload: { contestTitle: contest.title, contestSlug: contest.slug, artistName: contest.hostArtist!.name },
      })
    )
  )
  const failed = results.filter((r) => r.status === 'rejected')
  if (failed.length > 0) {
    console.error(
      `[Contest] ${failed.length}/${followers.length} notificações de contest publicado falharam`,
      (failed[0] as PromiseRejectedResult).reason
    )
  }
}

// ============================================================
// Queries — admin (lista tudo, qualquer status)
// ============================================================

export async function listAllContestsForAdmin() {
  const contests = await prisma.contest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      hostArtist: { select: { id: true, name: true, slug: true } },
      _count: { select: { entries: true } },
    },
  })
  return contests
}

// ============================================================
// Queries públicas
// ============================================================

export interface ContestListItem {
  id: string
  slug: string
  title: string
  coverKey: string | null
  deadline: Date
  prizePoints: number
  entryCount: number
  hostArtist: { name: string; slug: string } | null
}

export async function listPublishedContests(): Promise<ContestListItem[]> {
  const contests = await prisma.contest.findMany({
    where: { published: true },
    orderBy: { deadline: 'desc' },
    include: {
      hostArtist: { select: { name: true, slug: true } },
      _count: { select: { entries: true } },
    },
  })

  return contests.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    coverKey: c.coverKey,
    deadline: c.deadline,
    prizePoints: c.prizePoints,
    entryCount: c._count.entries,
    hostArtist: c.hostArtist,
  }))
}

export async function getContestBySlug(slug: string) {
  const contest = await prisma.contest.findUnique({
    where: { slug },
    include: {
      hostArtist: { select: { id: true, name: true, slug: true, photoUrl: true } },
    },
  })
  if (!contest || !contest.published) return null
  return contest
}

/** Versão para o admin — retorna mesmo se não publicado (preview). */
export async function getContestBySlugForAdmin(slug: string) {
  return prisma.contest.findUnique({
    where: { slug },
    include: {
      hostArtist: { select: { id: true, name: true, slug: true, photoUrl: true } },
    },
  })
}

export interface ContestSubmissionItem {
  id: string
  winner: boolean
  createdAt: Date
  track: {
    id: string
    slug: string
    title: string
    coverUrl: string | null
    audioKey: string
    genre: string | null
  }
  user: { id: string; handle: string | null; name: string | null }
}

export async function listContestSubmissions(contestId: string): Promise<ContestSubmissionItem[]> {
  const entries = await prisma.contestEntry.findMany({
    // Só submissões com a faixa JÁ PUBLICADA aparecem na aba pública — evita
    // vazar rascunho não moderado / faixa rejeitada (a entry continua no banco
    // e ainda bloqueia reenvio via @@unique, só não é exibida até ser aprovada).
    where: { contestId, track: { published: true } },
    orderBy: { createdAt: 'desc' },
    include: {
      track: { select: { id: true, slug: true, title: true, coverUrl: true, audioKey: true, genre: true } },
      user: { select: { id: true, handle: true, name: true } },
    },
  })
  return entries
}

export function isContestOpen(contest: { published: boolean; deadline: Date }): boolean {
  return contest.published && contest.deadline.getTime() > Date.now()
}
