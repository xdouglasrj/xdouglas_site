import { prisma } from '@/lib/prisma'
import { getContentCutoffDate } from '@/lib/settings/content-expiration'
import { addPoints } from '@/lib/points/points-service'
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

export async function addTrackComment(trackId: string, authorId: string, content: string) {
  const comment = await prisma.trackComment.create({
    data: { trackId, authorId, content },
    include: { author: { select: AUTHOR_SELECT } },
  })

  addPoints(authorId, 'COMMENT_CREATED').catch((err) => console.error('[TrackComment] Falha ao registrar pontos', err))

  notifyTrackComment(trackId, authorId, comment.author).catch((err) => console.error('[TrackComment] Falha ao criar notificação', err))

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

interface ListTrackCommentsViewer {
  userId: string | null
  role: string | null
}

export async function listTrackComments(trackId: string, viewer: ListTrackCommentsViewer = { userId: null, role: null }) {
  const cutoff = await getContentCutoffDate()
  const [comments, owner] = await Promise.all([
    prisma.trackComment.findMany({
      // Comentário fixado pelo admin ignora a janela de expiração — continua
      // visível mesmo após o corte de 24/36/48h
      where: { trackId, OR: [{ pinned: true }, { createdAt: { gte: cutoff } }] },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'asc' }],
      include: { author: { select: AUTHOR_SELECT } },
    }),
    getTrackOwner(trackId),
  ])

  // Se o dono da música escondeu os comentários recebidos, só o autor de
  // cada comentário, o próprio dono e admin/moderador continuam vendo.
  if (owner && !owner.showComentariosVisiveis) {
    const isPrivileged = !!viewer.role && PRIVILEGED_ROLES.includes(viewer.role)
    const isOwner = !!viewer.userId && viewer.userId === owner.ownerId
    if (!isPrivileged && !isOwner) {
      return comments.filter((c) => c.authorId === viewer.userId)
    }
  }

  return comments
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
