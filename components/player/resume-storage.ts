// ============================================================
// Progresso de reprodução para ANÔNIMO (V3 Plano 11) — localStorage,
// chave única, máx. ~50 entradas em LRU. Logado usa a API em vez
// disso (ver lib/social/playback-progress.ts).
// ============================================================

const STORAGE_KEY = 'xd_resume_progress'
const MAX_ENTRIES = 50

interface ResumeEntry {
  positionSeconds: number
  updatedAt: number
}

type ResumeStore = Record<string, ResumeEntry>

function readStore(): ResumeStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as ResumeStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: ResumeStore): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // localStorage indisponível/cheio — silencioso, não é crítico
  }
}

export function getLocalResumePosition(trackId: string): number | null {
  const entry = readStore()[trackId]
  return entry ? entry.positionSeconds : null
}

/** Grava e aplica LRU: se passar de MAX_ENTRIES, remove a entrada mais antiga. */
export function setLocalResumePosition(trackId: string, positionSeconds: number): void {
  const store = readStore()
  store[trackId] = { positionSeconds: Math.max(0, Math.floor(positionSeconds)), updatedAt: Date.now() }

  const keys = Object.keys(store)
  if (keys.length > MAX_ENTRIES) {
    const oldest = keys.sort((a, b) => store[a].updatedAt - store[b].updatedAt)
    const toRemove = oldest.slice(0, keys.length - MAX_ENTRIES)
    for (const key of toRemove) delete store[key]
  }

  writeStore(store)
}

export function clearLocalResumePosition(trackId: string): void {
  const store = readStore()
  if (!(trackId in store)) return
  delete store[trackId]
  writeStore(store)
}
