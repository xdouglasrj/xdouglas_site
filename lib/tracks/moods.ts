// ============================================================
// Moods e tons musicais (V3 Plano 5) — listas fixas em TS,
// não no banco (enum leve). Mood segue o padrão do Audius,
// em pt-BR e com emoji.
// ============================================================

export const TRACK_MOODS = [
  'Energética ⚡',
  'Festa 🎉',
  'Sentimental 😢',
  'Romântica 💘',
  'Relax 😌',
  'Agressiva 🔥',
  'Melancólica 🌧️',
  'Motivacional 💪',
  'Sombria 🌑',
  'Alegre ☀️',
] as const

export type TrackMood = (typeof TRACK_MOODS)[number]

export function isValidMood(value: string): value is TrackMood {
  return (TRACK_MOODS as readonly string[]).includes(value)
}

// 12 notas × maior/menor — select fechado, nunca campo livre
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export const MUSICAL_KEYS: readonly string[] = NOTES.flatMap((n) => [`${n} maior`, `${n} menor`])

export function isValidKey(value: string): boolean {
  return MUSICAL_KEYS.includes(value)
}

// Tags: máx. 10 por faixa, lowercase, sem espaços (padrão de chip)
export const MAX_TAGS = 10

export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9à-ú-]/g, '')
    .slice(0, 30)
}
