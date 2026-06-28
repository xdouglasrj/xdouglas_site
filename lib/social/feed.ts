import { prisma } from '@/lib/prisma'
import { getContentCutoffDate } from '@/lib/settings/content-expiration'

const FEED_PAGE_SIZE = 20
const COMMENTS_FEED_LIMIT = 10
const COMMENT_RATE_LIMIT_HOURS = 48

export class CommentRateLimitError extends Error {
  retryAt: Date
  constructor(retryAt: Date) {
    super('RATE_LIMITED')
    this.retryAt = retryAt
  }
}

export interface FeedAuthor {
  id: string
  handle: string | null
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
  handle: true,
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

/** Lança CommentRateLimitError se o usuário comentou há menos de 48h. */
export async function addComment(postId: string, authorId: string, content: string) {
  const lastComment = await prisma.comment.findFirst({
    where: { authorId },
    orderBy: { createdAt: 'desc' },
  })

  if (lastComment) {
    const retryAt = new Date(lastComment.createdAt.getTime() + COMMENT_RATE_LIMIT_HOURS * 60 * 60 * 1000)
    if (retryAt.getTime() > Date.now()) {
      throw new CommentRateLimitError(retryAt)
    }
  }

  return prisma.comment.create({
    data: { postId, authorId, content },
    include: { author: { select: AUTHOR_SELECT } },
  })
}

export async function getPost(postId: string) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: { author: { select: AUTHOR_SELECT } },
  })
}

/** Remove o post — autor ou admin podem excluir. Retorna false se não autorizado. */
export async function deletePost(postId: string, userId: string, isAdmin: boolean): Promise<boolean> {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) return false
  if (post.authorId !== userId && !isAdmin) return false

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { postId } }),
    prisma.like.deleteMany({ where: { postId } }),
    prisma.post.delete({ where: { id: postId } }),
  ])
  return true
}

/** Os N comentários mais recentes (ordem cronológica), mais o total. */
export async function listComments(postId: string, limit = COMMENTS_FEED_LIMIT) {
  const cutoff = await getContentCutoffDate()
  const where = { postId, createdAt: { gte: cutoff } }

  const [total, rows] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { author: { select: AUTHOR_SELECT } },
    }),
  ])

  return { comments: rows.reverse(), total }
}

/** Comentários paginados (lote dos mais recentes a partir de `offset`) — usado na página de comentários. */
export async function listAllComments(postId: string, limit = 20, offset = 0) {
  const cutoff = await getContentCutoffDate()
  const where = { postId, createdAt: { gte: cutoff } }

  const [total, rows] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: { author: { select: AUTHOR_SELECT } },
    }),
  ])

  return { comments: rows.reverse(), total }
}

/**
 * Comentários de TODOS os posts, mais recentes primeiro — a página
 * "Comentários" do sidebar. É aqui que vão os comentários que já saíram
 * da prévia de 10 do card no feed; continuam visíveis até expirarem
 * (mesmo prazo configurado em getContentCutoffDate) e então o cron de
 * limpeza os apaga de fato do banco.
 */
export async function listGlobalComments(limit = 20, offset = 0) {
  const cutoff = await getContentCutoffDate()
  const where = { createdAt: { gte: cutoff } }

  const [total, rows] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        author: { select: AUTHOR_SELECT },
        post: { select: { id: true, content: true } },
      },
    }),
  ])

  return { comments: rows, total }
}
