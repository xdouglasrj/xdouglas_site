import { prisma } from '@/lib/prisma'
import { getContentCutoffDate } from '@/lib/settings/content-expiration'

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

export async function addTrackComment(trackId: string, authorId: string, content: string) {
  return prisma.trackComment.create({
    data: { trackId, authorId, content },
    include: { author: { select: AUTHOR_SELECT } },
  })
}

export async function listTrackComments(trackId: string) {
  const cutoff = await getContentCutoffDate()
  return prisma.trackComment.findMany({
    // Comentário fixado pelo admin ignora a janela de expiração — continua
    // visível mesmo após o corte de 24/36/48h
    where: { trackId, OR: [{ pinned: true }, { createdAt: { gte: cutoff } }] },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'asc' }],
    include: { author: { select: AUTHOR_SELECT } },
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

/** Remove o comentário — autor ou admin podem excluir. Retorna false se não autorizado. */
export async function deleteTrackComment(commentId: string, userId: string, isAdmin: boolean) {
  const comment = await prisma.trackComment.findUnique({ where: { id: commentId } })
  if (!comment) return false
  if (comment.authorId !== userId && !isAdmin) return false

  await prisma.trackComment.delete({ where: { id: commentId } })
  return true
}
