import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications/notifications'

const THREAD_PAGE_SIZE = 20

const AUTHOR_SELECT = {
  id: true,
  handle: true,
  name: true,
  artisticName: true,
  photoUrl: true,
  role: true,
} as const

export async function createThread(authorId: string, title: string, body: string, sectorId: string) {
  return prisma.forumThread.create({ data: { authorId, title, body, sectorId } })
}

export async function listThreads(page = 1) {
  const [count, threads] = await Promise.all([
    prisma.forumThread.count(),
    prisma.forumThread.findMany({
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * THREAD_PAGE_SIZE,
      take: THREAD_PAGE_SIZE,
      include: {
        author: { select: AUTHOR_SELECT },
        _count: { select: { replies: true } },
      },
    }),
  ])

  return { threads, totalPages: Math.max(1, Math.ceil(count / THREAD_PAGE_SIZE)) }
}

export async function listThreadsBySector(sectorId: string, page = 1) {
  const [count, threads] = await Promise.all([
    prisma.forumThread.count({ where: { sectorId } }),
    prisma.forumThread.findMany({
      where: { sectorId },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * THREAD_PAGE_SIZE,
      take: THREAD_PAGE_SIZE,
      include: {
        author: { select: AUTHOR_SELECT },
        _count: { select: { replies: true } },
      },
    }),
  ])

  return { threads, totalPages: Math.max(1, Math.ceil(count / THREAD_PAGE_SIZE)) }
}

/** Setores ativos, ordenados, com contagem de tópicos — usado na entrada do fórum. */
export async function listActiveSectors() {
  const sectors = await prisma.forumSector.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    include: { _count: { select: { threads: true } } },
  })
  return sectors
}

export async function getSectorBySlug(slug: string) {
  return prisma.forumSector.findUnique({ where: { slug } })
}

export async function getThread(id: string) {
  return prisma.forumThread.findUnique({
    where: { id },
    include: {
      author: { select: AUTHOR_SELECT },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: AUTHOR_SELECT } },
      },
    },
  })
}

export class ThreadLockedError extends Error {
  constructor() {
    super('Este tópico está bloqueado para novas respostas')
  }
}

export async function addReply(threadId: string, authorId: string, body: string) {
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    select: { locked: true, title: true, authorId: true, sector: { select: { slug: true } } },
  })
  if (thread?.locked) throw new ThreadLockedError()

  const reply = await prisma.forumReply.create({
    data: { threadId, authorId, body },
    include: { author: { select: AUTHOR_SELECT } },
  })

  if (thread?.authorId) {
    createNotification({
      userId: thread.authorId,
      actorId: authorId,
      type: 'resposta_forum',
      payload: {
        actorName: reply.author.artisticName || reply.author.name || (reply.author.handle ? `@${reply.author.handle}` : 'Alguém'),
        threadId,
        threadTitle: thread.title,
        sectorSlug: thread.sector?.slug ?? null,
      },
    }).catch((err) => console.error('[Forum] Falha ao criar notificação', err))
  }

  return reply
}

/** Bloqueia/desbloqueia um tópico pra novas respostas — só admin chama isso. */
export async function setThreadLocked(threadId: string, locked: boolean) {
  return prisma.forumThread.update({ where: { id: threadId }, data: { locked } })
}

// ============================================================
// Setores — CRUD admin
// ============================================================

export async function listAllSectors() {
  return prisma.forumSector.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { threads: true } } },
  })
}

export async function createSector(data: { slug: string; name: string; description?: string; order?: number; onlyAdminPost?: boolean }) {
  return prisma.forumSector.create({ data })
}

export async function updateSector(
  id: string,
  data: Partial<{ slug: string; name: string; description: string | null; order: number; onlyAdminPost: boolean; active: boolean }>
) {
  return prisma.forumSector.update({ where: { id }, data })
}

export async function deleteSector(id: string) {
  return prisma.forumSector.delete({ where: { id } })
}
