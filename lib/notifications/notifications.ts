import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type NotificationType =
  | 'novo_seguidor'
  | 'curtida'
  | 'comentario'
  | 'resposta_forum'
  | 'musica_publicada'
  | 'presente_admin'

const NOTIFICATION_PAGE_SIZE = 20

interface CreateNotificationInput {
  userId: string
  actorId?: string | null
  type: NotificationType
  payload: Record<string, unknown>
}

/** Cria uma notificação — não cria nada quando o ator é o próprio destinatário (evita self-notify). */
export async function createNotification({ userId, actorId, type, payload }: CreateNotificationInput) {
  if (actorId && actorId === userId) return null

  return prisma.notification.create({
    data: { userId, type, payload: payload as Prisma.InputJsonValue },
  })
}

interface ListNotificationsOptions {
  page?: number
  filter?: 'all' | 'unread'
}

export async function listNotifications(userId: string, opts: ListNotificationsOptions = {}) {
  const { page = 1, filter = 'all' } = opts
  const where = { userId, ...(filter === 'unread' ? { read: false } : {}) }

  const [count, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * NOTIFICATION_PAGE_SIZE,
      take: NOTIFICATION_PAGE_SIZE,
    }),
  ])

  return { notifications, totalPages: Math.max(1, Math.ceil(count / NOTIFICATION_PAGE_SIZE)) }
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } })
}

/** Marca todas (ou um conjunto de ids) como lidas para o usuário. */
export async function markNotificationsRead(userId: string, ids?: string[]) {
  await prisma.notification.updateMany({
    where: { userId, ...(ids?.length ? { id: { in: ids } } : {}) },
    data: { read: true },
  })
}
