import { PointActionType } from '@prisma/client'

interface PointRule {
  // Valor padrão em XP — pode ser sobrescrito na chamada (ex: ADMIN_GIFT,
  // STORE_REDEMPTION, INVITE_ABUSE_PENALTY usam valor dinâmico)
  points: number
  // Máximo de OCORRÊNCIAS pontuadas por dia (não é o total de pontos —
  // ex: TRACK_LIKED com cap 20 = até 20 curtidas pontuadas, 40 XP no dia)
  dailyOccurrenceCap?: number
  // Só pode pontuar 1x na vida do usuário (cadastro, perfil, avatar, 1º login)
  once?: boolean
}

export const POINT_RULES: Record<PointActionType, PointRule> = {
  USER_REGISTERED: { points: 50, once: true },
  PROFILE_COMPLETED: { points: 100, once: true },
  AVATAR_ADDED: { points: 20, once: true },
  FIRST_LOGIN: { points: 10, once: true },
  DAILY_LOGIN: { points: 5 },
  DAILY_LOGIN_STREAK_BONUS: { points: 100 },
  TRACK_LIKED: { points: 2, dailyOccurrenceCap: 20 },
  COMMENT_CREATED: { points: 5, dailyOccurrenceCap: 10 },
  TRACK_SHARED: { points: 10, dailyOccurrenceCap: 10 },
  // Teto do artista — publicar continua liberado sem limite, só não
  // pontua além da 2ª faixa do dia
  TRACK_PUBLISHED: { points: 100, dailyOccurrenceCap: 2 },
  // Ouvir é a ação central do app do ouvinte — teto maior que as demais
  TRACK_PLAYED: { points: 3, dailyOccurrenceCap: 30 },
  PLAYLIST_CREATED: { points: 20, dailyOccurrenceCap: 3 },
  // Sem teto — já é raro por natureza (depende de alguém confirmar cadastro)
  FRIEND_INVITE_COMPLETED: { points: 300 },
  // Evento orgânico por faixa — dedup fica a cargo de quem chama (não
  // repete pra mesma faixa) em vez de teto diário
  TRACK_MILESTONE_1000: { points: 500 },
  // Valor vem do preço do StoreItem na hora do resgate — usar spendPoints()
  STORE_REDEMPTION: { points: 0 },
  // Valor vem da indicação penalizada (ex: -300, anula o que tinha ganho)
  INVITE_ABUSE_PENALTY: { points: 0 },
  // Valor definido pelo admin no momento do presente
  ADMIN_GIFT: { points: 0 },
  ADMIN_ADJUSTMENT: { points: 0 },
}

// A cada N dias consecutivos de login, soma o bônus de DAILY_LOGIN_STREAK_BONUS
export const LOGIN_STREAK_BONUS_EVERY_DAYS = 7

// Sequência quebra se passar mais que isso sem logar (tolera virar o dia
// sem ser exatamente 24h, ex: logar 23h e de novo 8h do dia seguinte)
export const LOGIN_STREAK_GRACE_HOURS = 48
