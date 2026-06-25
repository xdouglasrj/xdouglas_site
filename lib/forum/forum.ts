import { prisma } from '@/lib/prisma'

const THREAD_PAGE_SIZE = 20

const AUTHOR_SELECT = {
  id: true,
  handle: true,
  name: true,
  artisticName: true,
  photoUrl: true,
  role: true,
} as const

export async function createThread(authorId: string, title: string, body: string) {
  return prisma.forumThread.create({ data: { authorId, title, body } })
}

export async function listThreads(page = 1) {
  const [count, threads] = await Promise.all([
    prisma.forumThread.count(),
    prisma.forumThread.findMany({
      orderBy: { createdAt: 'desc' },
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

export async function addReply(threadId: string, authorId: string, body: string) {
  return prisma.forumReply.create({
    data: { threadId, authorId, body },
    include: { author: { select: AUTHOR_SELECT } },
  })
}
