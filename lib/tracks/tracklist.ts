// ============================================================
// Tracklist com timestamps (V3 Plano 10) — parser TOLERANTE, sem
// dependência de Prisma (client-safe: usado no preview do formulário e
// no servidor). Aceita o formato usual de DJ:
//   06:52 DJ Spen - When I Needed You Most
//   1:06:52  2. Artista - Música        (com HH e numeração)
//   2. 06:52 Artista - Música
// Regra: acha o PRIMEIRO timestamp da linha; o título é o texto após ele
// (numeração inicial "2." é removida). Linha sem timestamp/título é ignorada.
// ============================================================

export interface ParsedTracklistItem {
  position: number
  startSeconds: number
  title: string
}

export interface ParseTracklistResult {
  items: ParsedTracklistItem[]
  invalidCount: number
}

const TIMESTAMP_RE = /(?:\d{1,2}:)?\d{1,2}:\d{2}/
// Numeração inicial de faixa: "2.", "2)", "02 -" etc.
const LEADING_NUMBER_RE = /^\d{1,3}\s*[.)\-]\s*/
const MAX_TITLE_LENGTH = 300

function timestampToSeconds(token: string): number | null {
  const parts = token.split(':').map((p) => Number(p))
  if (parts.some((n) => !Number.isFinite(n))) return null
  let seconds = 0
  for (const p of parts) seconds = seconds * 60 + p
  return seconds
}

/** Converte texto colado no formulário em itens ordenados. */
export function parseTracklist(text: string): ParseTracklistResult {
  const items: ParsedTracklistItem[] = []
  let invalidCount = 0

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    const match = line.match(TIMESTAMP_RE)
    if (!match || match.index === undefined) {
      invalidCount++
      continue
    }

    const startSeconds = timestampToSeconds(match[0])
    if (startSeconds === null) {
      invalidCount++
      continue
    }

    // Título = texto DEPOIS do timestamp (sem numeração inicial). Se vazio,
    // tenta o que vem ANTES (caso "Artista - Música 06:52").
    let title = line.slice(match.index + match[0].length).replace(LEADING_NUMBER_RE, '').trim()
    if (!title) {
      title = line.slice(0, match.index).replace(LEADING_NUMBER_RE, '').trim()
    }
    if (!title) {
      invalidCount++
      continue
    }

    items.push({
      position: items.length + 1,
      startSeconds,
      title: title.slice(0, MAX_TITLE_LENGTH),
    })
  }

  return { items, invalidCount }
}

/** Reconstrói o texto (MM:SS ou HH:MM:SS) para pré-preencher a edição. */
export function tracklistItemsToText(
  items: ReadonlyArray<{ startSeconds: number; title: string }>,
): string {
  return items.map((i) => `${formatTimestamp(i.startSeconds)} ${i.title}`).join('\n')
}

/** Segundos → "MM:SS" ou "H:MM:SS" (para sets de mais de 1h). */
export function formatTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${m}:${ss}`
}

/**
 * Índice do item "tocando agora": o último cujo startSeconds já passou.
 * Retorna -1 antes do primeiro timestamp. Assume items ordenados por posição.
 */
export function activeTracklistIndex(
  items: ReadonlyArray<{ startSeconds: number }>,
  currentTime: number,
): number {
  let active = -1
  for (let i = 0; i < items.length; i++) {
    if (items[i].startSeconds <= currentTime) active = i
    else break
  }
  return active
}
