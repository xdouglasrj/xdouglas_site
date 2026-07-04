import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { categoryForType, parseNotificationPrefs } from './notification-prefs'

export type NotificationType =
  | 'novo_seguidor'
  | 'curtida'
  | 'comentario'
  | 'resposta_forum'
  | 'musica_publicada'
  | 'presente_admin'
  // V3 Plano 2 — interações em comentários de música
  | 'resposta_comentario'
  | 'curtida_comentario'
  // V3 Plano 3 — repost de música
  | 'repost'
  // V3 Plano 7 — marco de plays de uma faixa (250/1.000/10.000)
  | 'marco_plays'
  // V3 Plano 18 — evento novo publicado pelo artista que o usuário segue
  | 'evento_publicado'
  // V3 Plano 9 — completude de perfil (100% + lembrete de perfil incompleto)
  | 'perfil_completo'
  | 'perfil_incompleto_lembrete'
  // V3 Plano 6 — concurso novo publicado (seguidores do artista host) e
  // resultado do concurso (participante ganhou)
  | 'contest_publicado'
  | 'contest_resultado'

const NOTIFICATION_PAGE_SIZE = 20

interface CreateNotificationInput {
  userId: string
  actorId?: string | null
  type: NotificationType
  payload: Record<string, unknown>
}

/**
 * Cria uma notificação — não cria nada quando o ator é o próprio destinatário
 * (evita self-notify) NEM quando o destinatário desligou a categoria dessa
 * notificação em /perfil/editar (V3 Plano 19). A checagem é sempre no
 * servidor: o client nunca decide se a notificação é ou não criada.
 */
export async function createNotification({ userId, actorId, type, payload }: CreateNotificationInput) {
  if (actorId && actorId === userId) return null

  // "Presente do admin" é uma ação administrativa direta, não uma categoria
  // de atividade social — sempre entregue, sem checar preferência.
  if (type !== 'presente_admin') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { notificationPrefs: true } })
    if (!user) return null

    const prefs = parseNotificationPrefs(user.notificationPrefs)
    const category = categoryForType(type)
    if (!prefs[category]) return null
  }

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
