import { prisma } from '@/lib/prisma'
import type { SupportAttachmentType, SupportCategory } from '@prisma/client'

const SUPPORT_PAGE_SIZE = 20

export async function createTicket(
  userId: string,
  category: SupportCategory,
  message: string,
  attachment?: { key: string; url: string; type: SupportAttachmentType }
) {
  return prisma.supportTicket.create({
    data: {
      userId,
      category,
      message,
      attachmentKey: attachment?.key,
      attachmentUrl: attachment?.url,
      attachmentType: attachment?.type,
    },
  })
}

export async function listTickets(status: 'PENDING' | 'RESOLVED' | 'ALL', page = 1) {
  const where = status === 'ALL' ? {} : { status }

  const [count, tickets] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * SUPPORT_PAGE_SIZE,
      take: SUPPORT_PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, username: true, handle: true, email: true } },
      },
    }),
  ])

  return { tickets, totalPages: Math.max(1, Math.ceil(count / SUPPORT_PAGE_SIZE)) }
}

export async function resolveTicket(id: string) {
  return prisma.supportTicket.update({
    where: { id },
    data: { status: 'RESOLVED', resolvedAt: new Date() },
  })
}
