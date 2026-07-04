import { prisma } from '@/lib/prisma'
import { awardMilestoneOnce } from '@/lib/points/milestones'
import { createNotification } from '@/lib/notifications/notifications'

const BIO_MIN_LENGTH = 20
const PROFILE_MILESTONE_KIND = 'profile_100_percent'

export interface ProfileCompletenessItem {
  key: string
  label: string
  done: boolean
  /** Rota sugerida para o usuário resolver o item pendente. */
  actionHref: string
}

export interface ProfileCompleteness {
  percent: number
  items: ProfileCompletenessItem[]
  isComplete: boolean
}

interface CompletenessInput {
  photoUrl: string | null
  coverUrl: string | null
  bio: string | null
  instagramUrl: string | null
  youtubeUrl: string | null
  tiktokUrl: string | null
  websiteUrl: string | null
}

function hasAnySocialLink(user: CompletenessInput): boolean {
  return !!(user.instagramUrl || user.youtubeUrl || user.tiktokUrl || user.websiteUrl)
}

/**
 * Calcula o % de completude do perfil (pesos iguais, 7 itens) e o checklist
 * detalhado. Itens 5-7 (curtida, playlist, seguir 3) dependem de contagens
 * nas tabelas — por isso a função é async e recebe só o userId.
 */
export async function getProfileCompleteness(userId: string): Promise<ProfileCompleteness> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      photoUrl: true,
      coverUrl: true,
      bio: true,
      instagramUrl: true,
      youtubeUrl: true,
      tiktokUrl: true,
      websiteUrl: true,
    },
  })

  const [likeCount, playlistCount, followingCount] = await Promise.all([
    prisma.trackLike.count({ where: { userId } }),
    prisma.playlist.count({ where: { userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ])

  const items: ProfileCompletenessItem[] = [
    { key: 'photo', label: 'Foto de perfil', done: !!user.photoUrl, actionHref: '/perfil/editar' },
    { key: 'cover', label: 'Foto de capa', done: !!user.coverUrl, actionHref: '/perfil/editar' },
    {
      key: 'bio',
      label: 'Bio (mínimo 20 caracteres)',
      done: !!user.bio && user.bio.trim().length >= BIO_MIN_LENGTH,
      actionHref: '/perfil/editar',
    },
    {
      key: 'social_link',
      label: 'Pelo menos 1 link social',
      done: hasAnySocialLink(user),
      actionHref: '/perfil/editar',
    },
    { key: 'first_like', label: 'Curtir uma música', done: likeCount > 0, actionHref: '/trending' },
    {
      key: 'first_playlist',
      label: 'Criar uma playlist',
      done: playlistCount > 0,
      actionHref: '/perfil',
    },
    {
      key: 'follow_3',
      label: 'Seguir 3 perfis',
      done: followingCount >= 3,
      actionHref: '/generos',
    },
  ]

  const doneCount = items.filter((item) => item.done).length
  const percent = Math.round((doneCount / items.length) * 100)

  return { percent, items, isComplete: percent === 100 }
}

/**
 * Confere a completude atual e, se acabou de bater 100%, credita a
 * recompensa UMA única vez (via awardMilestoneOnce + MilestoneAward) e
 * dispara a notificação de parabéns. Idempotente: chamar de novo depois
 * de já ter creditado não paga de novo, mesmo que o usuário "descomplete"
 * e complete o perfil de novo (o unique [userId, kind, refId] persiste).
 *
 * Chamar após qualquer ação que possa ter mudado a completude (editar
 * perfil, curtir, criar playlist, seguir alguém).
 */
export async function checkAndAwardProfileCompletion(userId: string): Promise<void> {
  const { isComplete } = await getProfileCompleteness(userId)
  if (!isComplete) return

  const result = await awardMilestoneOnce(userId, PROFILE_MILESTONE_KIND, 'PROFILE_100_PERCENT')
  if (!result.awarded) return

  await createNotification({
    userId,
    type: 'perfil_completo',
    payload: { message: '🎉 Perfil completo! Você ganhou pontos de bônus.' },
  })
}

const REMINDER_ELIGIBLE_AFTER_DAYS = 3
const REMINDER_THRESHOLD_PERCENT = 50

/**
 * Lembrete leve: se o perfil está abaixo de 50% de completude e a conta
 * tem 3+ dias, envia UMA notificação convidando a completar. Marca
 * profileReminderSentAt para nunca repetir (mesmo que o perfil continue
 * incompleto depois).
 */
export async function maybeSendProfileReminder(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { createdAt: true, profileReminderSentAt: true },
  })

  if (user.profileReminderSentAt) return

  const accountAgeMs = Date.now() - user.createdAt.getTime()
  const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24)
  if (accountAgeDays < REMINDER_ELIGIBLE_AFTER_DAYS) return

  const { percent } = await getProfileCompleteness(userId)
  if (percent >= REMINDER_THRESHOLD_PERCENT) return

  await prisma.user.update({
    where: { id: userId },
    data: { profileReminderSentAt: new Date() },
  })

  await createNotification({
    userId,
    type: 'perfil_incompleto_lembrete',
    payload: { message: 'Complete seu perfil para ganhar pontos e aparecer melhor para outros usuários.' },
  })
}
