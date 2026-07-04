import { prisma } from '@/lib/prisma'
import { TRACK_SELECT, serializeTrack } from '@/lib/tracks/queries'
import type { TrackPublic } from '@/lib/tracks/types'

// ============================================================
// Progresso de reprodução (V3 Plano 11) — "retomar de onde parou".
// Só existe para usuários logados; anônimo usa localStorage no client
// (ver components/player/resume-storage.ts).
// ============================================================

/** Só retomamos faixas com mais de 10 minutos — música curta sempre recomeça. */
export const MIN_DURATION_FOR_RESUME_SECONDS = 10 * 60

/** Progresso apagado (faixa "vista") quando ultrapassa esta fração da duração. */
export const COMPLETE_THRESHOLD_RATIO = 0.95

/** Progresso descartado quando abaixo desta fração — considerado "só começou". */
export const RESUME_MIN_RATIO = 0.05

/** Progresso com updatedAt mais antigo que isto é elegível para limpeza. */
export const PROGRESS_MAX_AGE_DAYS = 90

export async function getPlaybackProgress(
  trackId: string,
  userId: string
): Promise<number | null> {
  const row = await prisma.playbackProgress.findUnique({
    where: { userId_trackId: { userId, trackId } },
    select: { positionSeconds: true },
  })
  return row?.positionSeconds ?? null
}

/**
 * Salva o progresso ou apaga o registro quando a faixa foi concluída
 * (>= COMPLETE_THRESHOLD_RATIO da duração). Chamado pelo endpoint com
 * throttle — nunca direto do client a cada tick.
 */
export async function savePlaybackProgress(
  trackId: string,
  userId: string,
  positionSeconds: number,
  durationSeconds: number | null
): Promise<{ completed: boolean }> {
  const isComplete =
    !!durationSeconds &&
    durationSeconds > 0 &&
    positionSeconds / durationSeconds >= COMPLETE_THRESHOLD_RATIO

  if (isComplete) {
    await prisma.playbackProgress
      .delete({ where: { userId_trackId: { userId, trackId } } })
      .catch(() => {
        // Já não existia — nada a fazer
      })
    return { completed: true }
  }

  await prisma.playbackProgress.upsert({
    where: { userId_trackId: { userId, trackId } },
    create: { userId, trackId, positionSeconds: Math.max(0, Math.floor(positionSeconds)) },
    update: { positionSeconds: Math.max(0, Math.floor(positionSeconds)) },
  })
  return { completed: false }
}

/** Máximo de faixas exibidas na seção "Continue ouvindo" do /inicio (V3 Plano 17). */
export const CONTINUE_LISTENING_LIMIT = 5

export interface ContinueListeningEntry {
  track: TrackPublic
  positionSeconds: number
}

/**
 * "Continue ouvindo" (V3 Plano 17) — faixas com progresso salvo entre
 * RESUME_MIN_RATIO e COMPLETE_THRESHOLD_RATIO (5%–95%), mais recentes
 * primeiro. Reusa PlaybackProgress do Plano 11 — não duplica dado.
 */
export async function getContinueListening(
  userId: string,
  limit = CONTINUE_LISTENING_LIMIT
): Promise<ContinueListeningEntry[]> {
  const rows = await prisma.playbackProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    // Busca uma folga maior que o limite porque parte pode ser filtrada
    // pela razão posição/duração (faixa quase no fim ou recém-iniciada).
    take: limit * 4,
    select: {
      positionSeconds: true,
      track: { select: TRACK_SELECT },
    },
  })

  const filtered = rows.filter(({ positionSeconds, track }) => {
    if (!track.durationSeconds || track.durationSeconds <= 0) return false
    const ratio = positionSeconds / track.durationSeconds
    return ratio >= RESUME_MIN_RATIO && ratio < COMPLETE_THRESHOLD_RATIO
  })

  return filtered.slice(0, limit).map(({ positionSeconds, track }) => ({
    track: serializeTrack(track),
    positionSeconds,
  }))
}

/** Limpeza oportunista — chamada no login, apaga progresso parado há 90+ dias. */
export async function cleanupStalePlaybackProgress(): Promise<number> {
  const cutoff = new Date(Date.now() - PROGRESS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
  const result = await prisma.playbackProgress.deleteMany({
    where: { updatedAt: { lt: cutoff } },
  })
  return result.count
}
