import { prisma } from '@/lib/prisma'
import { getContentCutoffDate } from '@/lib/settings/content-expiration'

const FEED_PAGE_SIZE = 20

export interface FeedAuthor {
  id: string
  username: string | null
  name: string | null
  artisticName: string | null
  photoUrl: string | null
  role: string
}

export interface FeedPost {
  id: string
  content: string
  createdAt: Date
  author: FeedAuthor
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

const AUTHOR_SELECT = {
  id: true,
  username: true,
  name: true,
  artisticName: true,
  photoUrl: true,
  role: true,
} as const

export async function createPost(authorId: string, content: string) {
  return prisma.post.create({
    data: { authorId, content },
  })
}

export async function listFeed(viewerId: string, page = 1): Promise<{ posts: FeedPost[]; totalPages: number }> {
  const cutoff = await getContentCutoffDate()

  const [count, rows] = await Promise.all([
    prisma.post.count(),
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * FEED_PAGE_SIZE,
      take: FEED_PAGE_SIZE,
      include: {
        author: { select: AUTHOR_SELECT },
        _count: { select: { likes: true, comments: { where: { createdAt: { gte: cutoff } } } } },
        likes: { where: { userId: viewerId }, select: { id: true } },
      },
    }),
  ])

  const posts: FeedPost[] = rows.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt,
    author: p.author,
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    likedByMe: p.likes.length > 0,
  }))

  return { posts, totalPages: Math.max(1, Math.ceil(count / FEED_PAGE_SIZE)) }
}

/** Liga/desliga a curtida. Retorna o novo estado (true = curtido). */
export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  })

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
    return false
  }

  await prisma.like.create({ data: { postId, userId } })
  return true
}

export async function addComment(postId: string, authorId: string, content: string) {
  return prisma.comment.create({
    data: { postId, authorId, content },
    include: { author: { select: AUTHOR_SELECT } },
  })
}

export async function listComments(postId: string) {
  const cutoff = await getContentCutoffDate()
  return prisma.comment.findMany({
    where: { postId, createdAt: { gte: cutoff } },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: AUTHOR_SELECT } },
  })
}
