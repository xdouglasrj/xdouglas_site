import { prisma } from '@/lib/prisma'
import { TRACK_SELECT, serializeTrack } from '@/lib/tracks/queries'
import type { TrackPublic } from '@/lib/tracks/types'

// ============================================================
// Histórico de escuta (V3 Plano 17) — PRIVADO, só o dono vê.
//
// Decisão: NÃO deriva de PlaybackProgress (Plano 11). Essa tabela só
// existe para faixas >= MIN_DURATION_FOR_RESUME_SECONDS (10min) e é
// APAGADA quando a faixa é concluída (>=95%) — a maioria das faixas do
// site é mais curta que 10min e nunca geraria linha lá. ListeningHistory
// registra qualquer faixa ouvida por >=10s, logado, sem depender da
// duração nem ser apagada ao concluir.
// ============================================================

/** Registra escuta só depois de ~10s tocando — evita poluir com cliques. */
export const MIN_LISTEN_SECONDS_TO_RECORD = 10

/** Máximo de entradas mantidas por usuário — as mais antigas são apagadas. */
export const MAX_HISTORY_ENTRIES_PER_USER = 200

/** Quantidade exibida na página /biblioteca/historico. */
export const HISTORY_PAGE_LIMIT = 50

/**
 * Upsert — reouvir uma faixa sobe ela pro topo (playedAt atualizado) em vez
 * de duplicar. Aplica o cap de MAX_HISTORY_ENTRIES_PER_USER apagando as
 * entradas mais antigas além do limite.
 */
export async function recordListen(userId: string, trackId: string): Promise<void> {
  await prisma.listeningHistory.upsert({
    where: { userId_trackId: { userId, trackId } },
    create: { userId, trackId },
    update: { playedAt: new Date() },
  })

  const excess = await prisma.listeningHistory.findMany({
    where: { userId },
    orderBy: { playedAt: 'desc' },
    skip: MAX_HISTORY_ENTRIES_PER_USER,
    select: { id: true },
  })
  if (excess.length > 0) {
    await prisma.listeningHistory.deleteMany({
      where: { id: { in: excess.map((e) => e.id) } },
    })
  }
}

export interface ListeningHistoryEntry {
  track: TrackPublic
  playedAt: string // ISO
}

/** Últimas faixas ouvidas (mais recente primeiro). Histórico é privado. */
export async function getRecentHistory(
  userId: string,
  limit = HISTORY_PAGE_LIMIT
): Promise<ListeningHistoryEntry[]> {
  const rows = await prisma.listeningHistory.findMany({
    where: { userId },
    orderBy: { playedAt: 'desc' },
    take: limit,
    select: {
      playedAt: true,
      track: { select: TRACK_SELECT },
    },
  })

  return rows.map((row) => ({
    track: serializeTrack(row.track),
    playedAt: row.playedAt.toISOString(),
  }))
}

/** "Limpar histórico" — apaga tudo do usuário. */
export async function clearHistory(userId: string): Promise<number> {
  const result = await prisma.listeningHistory.deleteMany({ where: { userId } })
  return result.count
}
