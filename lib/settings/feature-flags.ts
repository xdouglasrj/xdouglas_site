import { prisma } from '@/lib/prisma'

const SINGLETON_ID = 'singleton'
const CACHE_MS = 30_000

export const FEATURE_FLAG_KEYS = [
  'postar_feed',
  'curtir',
  'seguir',
  'postar_forum',
  'ouvir',
  'download',
  'upload',
  'comentar_musica',
  'playlist',
  'compartilhar',
] as const

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number]

export const FEATURE_FLAG_LABELS: Record<FeatureFlagKey, { label: string; effect: string }> = {
  postar_feed: { label: 'Postar no feed', effect: 'Esconde o botão de novo post e bloqueia a API de criação' },
  curtir: { label: 'Curtir', effect: 'Esconde os botões de curtir (post/comentário/música) e bloqueia a API' },
  seguir: { label: 'Seguir', effect: 'Esconde o botão de seguir/deixar de seguir' },
  postar_forum: { label: 'Postar no fórum', effect: 'Esconde "novo tópico"/"responder" e bloqueia a criação' },
  ouvir: { label: 'Ouvir músicas', effect: 'Desativa o player (modo manutenção de catálogo)' },
  download: { label: 'Download', effect: 'Esconde o botão de download e bloqueia a API' },
  upload: { label: 'Upload', effect: 'Esconde /upload e bloqueia a API, mesmo para quem já tem permissão' },
  comentar_musica: { label: 'Comentar em músicas', effect: 'Desliga os comentários nas músicas' },
  playlist: { label: 'Playlists', effect: 'Esconde a criação de playlist' },
  compartilhar: { label: 'Compartilhar', effect: 'Esconde o botão de compartilhar música' },
}

type FeatureFlags = Record<FeatureFlagKey, boolean>

function defaultFlags(): FeatureFlags {
  return Object.fromEntries(FEATURE_FLAG_KEYS.map((k) => [k, true])) as FeatureFlags
}

let cache: { flags: FeatureFlags; expiresAt: number } | null = null

/** Lê as feature flags do banco com cache curto (30s) — lido em quase toda request. */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  if (cache && cache.expiresAt > Date.now()) return cache.flags

  const s = await prisma.appSettings.findUnique({ where: { id: SINGLETON_ID }, select: { featureFlags: true } })
  const stored = (s?.featureFlags ?? {}) as Partial<Record<FeatureFlagKey, boolean>>
  const flags = { ...defaultFlags(), ...stored }

  cache = { flags, expiresAt: Date.now() + CACHE_MS }
  return flags
}

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const flags = await getFeatureFlags()
  return flags[key]
}

export async function setFeatureFlags(flags: Partial<FeatureFlags>): Promise<FeatureFlags> {
  const current = await getFeatureFlags()
  const next = { ...current, ...flags }

  await prisma.appSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, featureFlags: next },
    update: { featureFlags: next },
  })

  cache = { flags: next, expiresAt: Date.now() + CACHE_MS }
  return next
}
