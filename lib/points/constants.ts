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
  // V3 Plano 3 — ponto vai para o ARTISTA que recebeu o repost (não para
  // quem repostou, para não virar farm). Valor entre like (2) e share (10).
  REPOST_RECEIVED: { points: 5, dailyOccurrenceCap: 20 },
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
  // V3 Plano 7 — marcos de plays do artista (dedup via MilestoneAward,
  // não via teto diário — cada trackId só credita 1x por marco)
  TRACK_MILESTONE_250: { points: 150 },
  TRACK_MILESTONE_10000: { points: 2000 },
  // Tarefas "Ganhe pontos" — dedup via MilestoneAward
  FIRST_COMMENT_OF_WEEK: { points: 15 },
  FIRST_PLAYLIST_CREATED: { points: 50 },
  FIRST_LIKE_GIVEN: { points: 10 },
  // V3 Plano 13 — valor vem de HIGHLIGHT_COST_POINTS na hora do débito
  // (spendPoints com valor dinâmico, igual STORE_REDEMPTION)
  HIGHLIGHT_TRACK: { points: 0 },
  // V3 Plano 9 — perfil 100% completo. Dedup real é via MilestoneAward
  // (awardMilestoneOnce), não via este `once` — mas mantemos `once` também
  // como segunda trava caso o chamador use addPoints diretamente por engano.
  PROFILE_100_PERCENT: { points: 150, once: true },
}

// ── V3 Plano 13 — Destaque de faixa com pontos ("Highlight") ──
// Custo e duração ajustáveis pelo dono do produto (ponto único de ajuste).
// Valor inicial alinhado ao item FEATURE_TRACK da loja (10.000 pts / 24h).
export const HIGHLIGHT_COST_POINTS = 10_000
export const HIGHLIGHT_DURATION_HOURS = 24
// Anti-spam: no máx. 1 destaque ativo por faixa e 2 faixas destacadas ao
// mesmo tempo por usuário (checados na transação de compra).
export const HIGHLIGHT_MAX_ACTIVE_PER_TRACK = 1
export const HIGHLIGHT_MAX_ACTIVE_PER_USER = 2

// A cada N dias consecutivos de login, soma o bônus de DAILY_LOGIN_STREAK_BONUS
export const LOGIN_STREAK_BONUS_EVERY_DAYS = 7

// Sequência quebra se passar mais que isso sem logar (tolera virar o dia
// sem ser exatamente 24h, ex: logar 23h e de novo 8h do dia seguinte)
export const LOGIN_STREAK_GRACE_HOURS = 48
