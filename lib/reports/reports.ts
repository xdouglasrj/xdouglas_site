import { prisma } from '@/lib/prisma'
import type { ReportTargetType } from '@prisma/client'

const REPORTS_PAGE_SIZE = 20

export async function createReport(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: string
) {
  return prisma.report.create({
    data: { reporterId, targetType, targetId, reason },
  })
}

export async function listReports(status: 'PENDING' | 'RESOLVED' | 'DISMISSED' | 'ALL', page = 1) {
  const where = status === 'ALL' ? {} : { status }

  const [count, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * REPORTS_PAGE_SIZE,
      take: REPORTS_PAGE_SIZE,
      include: {
        reporter: { select: { id: true, username: true, name: true } },
      },
    }),
  ])

  return { reports, totalPages: Math.max(1, Math.ceil(count / REPORTS_PAGE_SIZE)) }
}

export async function resolveReport(id: string, status: 'RESOLVED' | 'DISMISSED') {
  return prisma.report.update({
    where: { id },
    data: { status, resolvedAt: new Date() },
  })
}

/** Remove o conteúdo denunciado (usado quando o admin resolve excluindo). */
export async function deleteReportedContent(targetType: ReportTargetType, targetId: string) {
  switch (targetType) {
    case 'POST':
      await prisma.comment.deleteMany({ where: { postId: targetId } })
      await prisma.like.deleteMany({ where: { postId: targetId } })
      await prisma.post.deleteMany({ where: { id: targetId } })
      break
    case 'COMMENT':
      await prisma.comment.deleteMany({ where: { id: targetId } })
      break
    case 'FORUM_THREAD':
      await prisma.forumReply.deleteMany({ where: { threadId: targetId } })
      await prisma.forumThread.deleteMany({ where: { id: targetId } })
      break
    case 'FORUM_REPLY':
      await prisma.forumReply.deleteMany({ where: { id: targetId } })
      break
    // TRACK e USER têm fluxos próprios de remoção/bloqueio nas telas
    // de músicas e cadastros — aqui só marcamos a denúncia como resolvida.
    case 'TRACK':
    case 'USER':
      break
  }
}
