// ============================================================
// Tipo de upload (V3 Plano 16) — lista fixa em TS, não enum no
// banco (coluna String). Referência: hearthis.at declara
// "Tipo: DJ-Set" na música — aqui simplificado a 3 valores.
// ============================================================

export const TRACK_KINDS = ['track', 'set', 'podcast'] as const

export type TrackKind = (typeof TRACK_KINDS)[number]

export const TRACK_KIND_LABELS: Record<TrackKind, string> = {
  track: 'Música',
  set: 'Set/Mix',
  podcast: 'Podcast',
}

export const DEFAULT_TRACK_KIND: TrackKind = 'track'

export function isValidTrackKind(value: string): value is TrackKind {
  return (TRACK_KINDS as readonly string[]).includes(value)
}

export function trackKindLabel(kind: string): string {
  return isValidTrackKind(kind) ? TRACK_KIND_LABELS[kind] : TRACK_KIND_LABELS[DEFAULT_TRACK_KIND]
}

// ============================================================
// Faixas de duração (V3 Plano 16) — usadas no filtro de /busca.
// Baseado em durationSeconds. minSeconds inclusive, maxSeconds
// exclusive (null = sem limite superior).
// ============================================================

export interface DurationBucket {
  id: string
  label: string
  minSeconds: number
  maxSeconds: number | null
}

export const DURATION_BUCKETS: readonly DurationBucket[] = [
  { id: 'ate-15', label: 'Até 15 min', minSeconds: 0, maxSeconds: 15 * 60 },
  { id: '15-45', label: '15–45 min', minSeconds: 15 * 60, maxSeconds: 45 * 60 },
  { id: '45-90', label: '45–90 min', minSeconds: 45 * 60, maxSeconds: 90 * 60 },
  { id: '90-mais', label: '90+ min', minSeconds: 90 * 60, maxSeconds: null },
]

export function isValidDurationBucketId(value: string): boolean {
  return DURATION_BUCKETS.some((b) => b.id === value)
}

export function getDurationBucket(id: string): DurationBucket | null {
  return DURATION_BUCKETS.find((b) => b.id === id) ?? null
}
