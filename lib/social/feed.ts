import { prisma } from '@/lib/prisma'
import { getContentCutoffDate } from '@/lib/settings/content-expiration'
import { addPoints } from '@/lib/points/points-service'

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
  pinned: boolean
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
      // Fixado pelo admin aparece sempre primeiro, por tempo indeterminado
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * FEED_PAGE_SIZE,
      take: FEED_PAGE_SIZE,
      include: {
        author: { select: AUTHOR_SELECT },
        _count: { select: { likes: true, comments: { where: { OR: [{ pinned: true }, { createdAt: { gte: cutoff } }] } } } },
        likes: { where: { userId: viewerId }, select: { id: true } },
      },
    }),
  ])

  const posts: FeedPost[] = rows.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt,
    pinned: p.pinned,
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

  const comment = await prisma.comment.create({
    data: { postId, authorId, content },
    include: { author: { select: AUTHOR_SELECT } },
  })

  addPoints(authorId, 'COMMENT_CREATED').catch((err) => console.error('[Comment] Falha ao registrar pontos', err))

  return comment
}

export async function getPost(postId: string) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: { author: { select: AUTHOR_SELECT } },
  })
}

/** Fixa/desafixa um post no topo do feed — só admin pode chamar (checado na rota). */
export async function togglePostPin(postId: string, pinned: boolean) {
  return prisma.post.update({
    where: { id: postId },
    data: { pinned, pinnedAt: pinned ? new Date() : null },
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

const PINNED_AUTHOR_SELECT = { author: { select: AUTHOR_SELECT } } as const

/** Comentários fixados do post (sempre visíveis, em qualquer página). */
function listPinnedComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, pinned: true },
    orderBy: { createdAt: 'asc' },
    include: PINNED_AUTHOR_SELECT,
  })
}

/**
 * Os N comentários mais recentes (ordem cronológica), com os fixados
 * sempre prefixados no topo, mais o total (fixados + dentro da janela).
 * `pinnedCount` informa quantos itens do array são fixados — usado pelo
 * front pra acertar o `offset` da paginação em listAllComments.
 */
export async function listComments(postId: string, limit = COMMENTS_FEED_LIMIT) {
  const cutoff = await getContentCutoffDate()
  const unpinnedWhere = { postId, pinned: false, createdAt: { gte: cutoff } }

  const [pinned, unpinnedTotal, rows] = await Promise.all([
    listPinnedComments(postId),
    prisma.comment.count({ where: unpinnedWhere }),
    prisma.comment.findMany({
      where: unpinnedWhere,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: PINNED_AUTHOR_SELECT,
    }),
  ])

  return {
    comments: [...pinned, ...rows.reverse()],
    total: unpinnedTotal + pinned.length,
    pinnedCount: pinned.length,
  }
}

/**
 * Comentários paginados (lote dos mais recentes a partir de `offset`) —
 * usado na página de comentários. Os fixados só vêm na primeira página
 * (offset 0) pra não duplicar quando o front carrega mais.
 */
export async function listAllComments(postId: string, limit = 20, offset = 0) {
  const cutoff = await getContentCutoffDate()
  const unpinnedWhere = { postId, pinned: false, createdAt: { gte: cutoff } }

  const [pinned, pinnedTotal, unpinnedTotal, rows] = await Promise.all([
    offset === 0 ? listPinnedComments(postId) : Promise.resolve([]),
    prisma.comment.count({ where: { postId, pinned: true } }),
    prisma.comment.count({ where: unpinnedWhere }),
    prisma.comment.findMany({
      where: unpinnedWhere,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: PINNED_AUTHOR_SELECT,
    }),
  ])

  return {
    comments: [...pinned, ...rows.reverse()],
    total: unpinnedTotal + pinnedTotal,
    pinnedCount: pinned.length,
  }
}

/** Fixa/desafixa um comentário do feed — só admin pode chamar (checado na rota). */
export async function togglePostCommentPin(commentId: string, pinned: boolean) {
  return prisma.comment.update({
    where: { id: commentId },
    data: { pinned, pinnedAt: pinned ? new Date() : null },
    include: { author: { select: AUTHOR_SELECT } },
  })
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
  const where = { OR: [{ pinned: true }, { createdAt: { gte: cutoff } }] }

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
