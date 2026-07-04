import type { NotificationType } from './notifications'

/**
 * Categorias que o usuário liga/desliga em /perfil/editar. Cada categoria
 * agrupa 1+ NotificationType — granularidade por categoria (não por tipo
 * individual), espelhando o hearthis.at (like, comentário, repost, etc.).
 */
export type NotificationCategory =
  | 'likes'
  | 'comments'
  | 'follows'
  | 'reposts'
  | 'forum'
  | 'events'
  | 'uploads'
  | 'milestones'
  | 'profile'

export type NotificationPrefs = Record<NotificationCategory, boolean> & {
  // Reservado para o futuro digest por e-mail — aguarda infra de e-mail do
  // domínio (ver memória do projeto). Salvo mas NUNCA lido/usado hoje.
  emailDigest: boolean
}

/** Tudo ligado in-app por padrão; e-mail desligado (sem infra ainda). */
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  likes: true,
  comments: true,
  follows: true,
  reposts: true,
  forum: true,
  events: true,
  uploads: true,
  milestones: true,
  profile: true,
  emailDigest: false,
}

/** Mapeia cada NotificationType para a categoria que o usuário controla. */
const TYPE_TO_CATEGORY: Record<NotificationType, NotificationCategory> = {
  curtida: 'likes',
  curtida_comentario: 'likes',
  comentario: 'comments',
  resposta_comentario: 'comments',
  novo_seguidor: 'follows',
  repost: 'reposts',
  resposta_forum: 'forum',
  evento_publicado: 'events',
  musica_publicada: 'uploads',
  marco_plays: 'milestones',
  perfil_completo: 'profile',
  perfil_incompleto_lembrete: 'profile',
  // Presente do admin — sempre entregue, não é uma categoria que o usuário desliga.
  presente_admin: 'profile',
  // V3 Plano 6 — concursos usam a mesma categoria de eventos (agenda/vitrine
  // do artista), já existente e ligada por padrão.
  contest_publicado: 'events',
  contest_resultado: 'events',
}

/** Normaliza o JSON salvo no banco, preenchendo categorias ausentes (usuários antigos) com o default. */
export function parseNotificationPrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_NOTIFICATION_PREFS }

  const value = raw as Partial<Record<keyof NotificationPrefs, unknown>>
  const result = { ...DEFAULT_NOTIFICATION_PREFS }
  for (const key of Object.keys(DEFAULT_NOTIFICATION_PREFS) as (keyof NotificationPrefs)[]) {
    if (typeof value[key] === 'boolean') result[key] = value[key] as boolean
  }
  return result
}

/** Categoria correspondente a um tipo de notificação. */
export function categoryForType(type: NotificationType): NotificationCategory {
  return TYPE_TO_CATEGORY[type]
}
