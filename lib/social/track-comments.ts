import { prisma } from '@/lib/prisma'
import { getContentCutoffDate } from '@/lib/settings/content-expiration'
import { addPoints } from '@/lib/points/points-service'
import { awardMilestoneOnce } from '@/lib/points/milestones'
import { getIsoWeekId } from '@/lib/gamification'
import { createNotification } from '@/lib/notifications/notifications'

// Limite de caracteres por comentário — evita que alguém escreva um texto
// gigante (ex.: cole um livro) na caixa de comentários de uma música.
export const TRACK_COMMENT_MAX_LENGTH = 500

const AUTHOR_SELECT = {
  id: true,
  handle: true,
  name: true,
  artisticName: true,
  photoUrl: true,
  role: true,
} as const

const PRIVILEGED_ROLES = ['ADMIN', 'MODERATOR']

/** Dono de uma música — quem decide se aceita comentários e se eles ficam públicos. */
export async function getTrackOwner(trackId: string) {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: {
      submittedById: true,
      artist: { select: { userId: true } },
    },
  })
  if (!track) return null

  const ownerId = track.submittedById ?? track.artist?.userId ?? null
  if (!ownerId) return { ownerId: null, allowComentariosNaMusica: true, showComentariosVisiveis: true }

  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { id: true, allowComentariosNaMusica: true, showComentariosVisiveis: true },
  })
  if (!owner) return { ownerId: null, allowComentariosNaMusica: true, showComentariosVisiveis: true }

  return { ownerId: owner.id, allowComentariosNaMusica: owner.allowComentariosNaMusica, showComentariosVisiveis: owner.showComentariosVisiveis }
}

interface AddTrackCommentOptions {
  /** Resposta a outro comentário — sempre achatada para 1 nível (padrão Audius) */
  parentId?: string | null
  /** Momento da música (em segundos) em que o comentário foi escrito */
  timestampSeconds?: number | null
}

export async function addTrackComment(
  trackId: string,
  authorId: string,
  content: string,
  options: AddTrackCommentOptions = {}
) {
  let parentId = options.parentId ?? null
  let parentAuthorId: string | null = null

  if (parentId) {
    const parent = await prisma.trackComment.findUnique({
      where: { id: parentId },
      select: { id: true, trackId: true, parentId: true, authorId: true },
    })
    // Pai inexistente ou de outra música — vira comentário raiz
    if (!parent || parent.trackId !== trackId) {
      parentId = null
    } else {
      // Responder uma resposta vira resposta do MESMO pai (1 nível só)
      parentId = parent.parentId ?? parent.id
      parentAuthorId = parent.authorId
    }
  }

  const comment = await prisma.trackComment.create({
    data: {
      trackId,
      authorId,
      content,
      parentId,
      timestampSeconds: options.timestampSeconds ?? null,
    },
    include: { author: { select: AUTHOR_SELECT } },
  })

  addPoints(authorId, 'COMMENT_CREATED').catch((err) => console.error('[TrackComment] Falha ao registrar pontos', err))

  // V3 Plano 7 — tarefa "1º comentário da semana": paga só a primeira vez
  // por semana ISO (idempotente via @@unique do MilestoneAward), separado
  // e ADICIONAL ao COMMENT_CREATED de cima (que tem teto diário próprio).
  awardMilestoneOnce(authorId, 'first_comment_week', 'FIRST_COMMENT_OF_WEEK', getIsoWeekId()).catch((err) =>
    console.error('[TrackComment] Falha ao registrar marco semanal', err)
  )

  if (parentId && parentAuthorId) {
    notifyCommentReply(trackId, parentAuthorId, authorId, comment.author).catch((err) =>
      console.error('[TrackComment] Falha ao notificar resposta', err)
    )
  } else {
    notifyTrackComment(trackId, authorId, comment.author).catch((err) => console.error('[TrackComment] Falha ao criar notificação', err))
  }

  return comment
}

async function notifyTrackComment(
  trackId: string,
  commenterId: string,
  commenter: { handle: string | null; name: string | null; artisticName: string | null }
) {
  const [owner, track] = await Promise.all([
    getTrackOwner(trackId),
    prisma.track.findUnique({ where: { id: trackId }, select: { title: true, slug: true } }),
  ])
  if (!owner?.ownerId || !track) return

  await createNotification({
    userId: owner.ownerId,
    actorId: commenterId,
    type: 'comentario',
    payload: {
      actorName: commenter.artisticName || commenter.name || (commenter.handle ? `@${commenter.handle}` : 'Alguém'),
      trackTitle: track.title,
      trackSlug: track.slug,
    },
  })
}

async function notifyCommentReply(
  trackId: string,
  parentAuthorId: string,
  replierId: string,
  replier: { handle: string | null; name: string | null; artisticName: string | null }
) {
  const track = await prisma.track.findUnique({ where: { id: trackId }, select: { title: true, slug: true } })
  if (!track) return

  await createNotification({
    userId: parentAuthorId,
    actorId: replierId,
    type: 'resposta_comentario',
    payload: {
      actorName: replier.artisticName || replier.name || (replier.handle ? `@${replier.handle}` : 'Alguém'),
      trackTitle: track.title,
      trackSlug: track.slug,
    },
  })
}

interface ListTrackCommentsViewer {
  userId: string | null
  role: string | null
}

/** Shape que o frontend recebe — comentário raiz com replies aninhadas (1 nível). */
export interface TrackCommentView {
  id: string
  content: string
  createdAt: Date
  editedAt: Date | null
  pinned: boolean
  parentId: string | null
  timestampSeconds: number | null
  likeCount: number
  likedByMe: boolean
  likedByArtist: boolean
  author: { id: string; handle: string | null; name: string | null; artisticName: string | null; photoUrl: string | null; role: string }
  replies: TrackCommentView[]
}

export async function listTrackComments(trackId: string, viewer: ListTrackCommentsViewer = { userId: null, role: null }) {
  const cutoff = await getContentCutoffDate()
  const [rows, owner] = await Promise.all([
    prisma.trackComment.findMany({
      // Comentário fixado pelo admin ignora a janela de expiração — continua
      // visível mesmo após o corte de 24/36/48h
      where: { trackId, OR: [{ pinned: true }, { createdAt: { gte: cutoff } }] },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'asc' }],
      include: {
        author: { select: AUTHOR_SELECT },
        _count: { select: { likes: true } },
      },
    }),
    getTrackOwner(trackId),
  ])

  const artistUserId = owner?.ownerId ?? null

  // Likes do viewer e do artista da faixa — só o que o selo/coração precisa,
  // sem carregar a lista completa de likes de cada comentário.
  const idsToCheck = [viewer.userId, artistUserId].filter((id): id is string => !!id)
  const likeRows = idsToCheck.length
    ? await prisma.trackCommentLike.findMany({
        where: { userId: { in: idsToCheck }, comment: { trackId } },
        select: { commentId: true, userId: true },
      })
    : []
  const likedByMeSet = new Set(likeRows.filter((l) => l.userId === viewer.userId).map((l) => l.commentId))
  const likedByArtistSet = new Set(likeRows.filter((l) => l.userId === artistUserId).map((l) => l.commentId))

  let visible = rows
  // Se o dono da música escondeu os comentários recebidos, só o autor de
  // cada comentário, o próprio dono e admin/moderador continuam vendo.
  if (owner && !owner.showComentariosVisiveis) {
    const isPrivileged = !!viewer.role && PRIVILEGED_ROLES.includes(viewer.role)
    const isOwner = !!viewer.userId && viewer.userId === owner.ownerId
    if (!isPrivileged && !isOwner) {
      visible = rows.filter((c) => c.authorId === viewer.userId)
    }
  }

  // Monta a árvore raiz → replies (1 nível). Reply cujo pai ficou fora da
  // janela de visibilidade é descartada (não tem onde ancorar).
  function toView(c: (typeof rows)[number]): TrackCommentView {
    return {
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      editedAt: c.editedAt,
      pinned: c.pinned,
      parentId: c.parentId,
      timestampSeconds: c.timestampSeconds,
      likeCount: c._count.likes,
      likedByMe: likedByMeSet.has(c.id),
      likedByArtist: likedByArtistSet.has(c.id),
      author: c.author,
      replies: [],
    }
  }

  const rootsById = new Map<string, TrackCommentView>()
  const roots: TrackCommentView[] = []
  for (const c of visible) {
    if (!c.parentId) {
      const view = toView(c)
      rootsById.set(c.id, view)
      roots.push(view)
    }
  }
  for (const c of visible) {
    if (c.parentId) {
      rootsById.get(c.parentId)?.replies.push(toView(c))
    }
  }

  return roots
}

/** Curte/descurte um comentário. Retorna o novo estado + contagem. */
export async function toggleTrackCommentLike(commentId: string, userId: string, liked: boolean) {
  const comment = await prisma.trackComment.findUnique({
    where: { id: commentId },
    select: { id: true, trackId: true, authorId: true },
  })
  if (!comment) return null

  if (liked) {
    await prisma.trackCommentLike.upsert({
      where: { commentId_userId: { commentId, userId } },
      create: { commentId, userId },
      update: {},
    })
    notifyCommentLike(comment.trackId, comment.authorId, userId).catch((err) =>
      console.error('[TrackCommentLike] Falha ao notificar', err)
    )
  } else {
    await prisma.trackCommentLike.deleteMany({ where: { commentId, userId } })
  }

  const likeCount = await prisma.trackCommentLike.count({ where: { commentId } })
  return { liked, likeCount }
}

async function notifyCommentLike(trackId: string, commentAuthorId: string, likerId: string) {
  const [liker, track] = await Promise.all([
    prisma.user.findUnique({ where: { id: likerId }, select: { handle: true, name: true, artisticName: true } }),
    prisma.track.findUnique({ where: { id: trackId }, select: { title: true, slug: true } }),
  ])
  if (!liker || !track) return

  await createNotification({
    userId: commentAuthorId,
    actorId: likerId,
    type: 'curtida_comentario',
    payload: {
      actorName: liker.artisticName || liker.name || (liker.handle ? `@${liker.handle}` : 'Alguém'),
      trackTitle: track.title,
      trackSlug: track.slug,
    },
  })
}

/** Fixa/desafixa um comentário — só admin pode chamar (checado na rota). */
export async function toggleTrackCommentPin(commentId: string, pinned: boolean) {
  return prisma.trackComment.update({
    where: { id: commentId },
    data: { pinned, pinnedAt: pinned ? new Date() : null },
    include: { author: { select: AUTHOR_SELECT } },
  })
}

/** Edita o conteúdo — só o autor pode editar. Retorna null se não for o autor. */
export async function updateTrackComment(commentId: string, userId: string, content: string) {
  const comment = await prisma.trackComment.findUnique({ where: { id: commentId } })
  if (!comment || comment.authorId !== userId) return null

  return prisma.trackComment.update({
    where: { id: commentId },
    data: { content, editedAt: new Date() },
    include: { author: { select: AUTHOR_SELECT } },
  })
}

/**
 * Remove o comentário — autor, admin, ou o dono da música em que o
 * comentário foi feito podem excluir. Retorna false se não autorizado.
 */
export async function deleteTrackComment(commentId: string, userId: string, isAdmin: boolean) {
  const comment = await prisma.trackComment.findUnique({ where: { id: commentId } })
  if (!comment) return false

  if (comment.authorId === userId || isAdmin) {
    await prisma.trackComment.delete({ where: { id: commentId } })
    return true
  }

  const owner = await getTrackOwner(comment.trackId)
  if (owner?.ownerId !== userId) return false

  await prisma.trackComment.delete({ where: { id: commentId } })
  return true
}
