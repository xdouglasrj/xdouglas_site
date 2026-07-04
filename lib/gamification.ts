// V3 Plano 7 — Gamificação: streak de login e marcos (milestones).
//
// Todos os VALORES de pontos ficam centralizados em lib/points/constants.ts
// (POINT_RULES), a mesma fonte usada pelo resto do sistema de pontos — não
// duplicado aqui. Este arquivo só reúne configuração estrutural específica
// do Plano 7 (limiares de marcos e tarefas da página "Ganhe pontos") para
// facilitar ajuste futuro do dono do produto.

/** Limiares de plays (ListeningHistory/AnalyticsEvent PLAY_COMPLETE) que disparam marco + notificação ao artista. */
export const TRACK_PLAY_MILESTONES = [
  { threshold: 250, kind: 'track_plays_250' as const, action: 'TRACK_MILESTONE_250' as const },
  { threshold: 1000, kind: 'track_plays_1000' as const, action: 'TRACK_MILESTONE_1000' as const },
  { threshold: 10000, kind: 'track_plays_10000' as const, action: 'TRACK_MILESTONE_10000' as const },
]

/**
 * ISO week identifier ("2026-W27") usado como refId do marco
 * "1º comentário da semana" — semana reseta na segunda-feira, fuso do
 * servidor (mesmo padrão simples usado no resto do projeto, sem
 * conversão explícita de timezone).
 */
export function getIsoWeekId(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7 // domingo=0 -> 7, segunda=1 permanece 1
  d.setUTCDate(d.getUTCDate() + 4 - dayNum) // joga pra quinta-feira da mesma semana ISO
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}
