import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const SINGLETON_ID = 'singleton'

// Guardado dentro de app_settings.feature_flags, sob a chave "ads" —
// reaproveita a coluna JSON existente em vez de migrar uma nova tabela.
export interface AdsSettings {
  enabled: boolean
  slots: Record<string, string> // chave do slot (lib/ads/config.ts) -> ID do slot no provedor
}

const DEFAULT_ADS_SETTINGS: AdsSettings = { enabled: false, slots: {} }

/** Lê o estado atual do toggle de ads e os IDs de slot configurados pelo admin. */
export async function getAdsSettings(): Promise<AdsSettings> {
  const s = await prisma.appSettings.findUnique({ where: { id: SINGLETON_ID } })
  const flags = (s?.featureFlags as Record<string, unknown> | null) ?? {}
  const ads = flags.ads as Partial<AdsSettings> | undefined
  return {
    enabled: ads?.enabled ?? DEFAULT_ADS_SETTINGS.enabled,
    slots: ads?.slots ?? DEFAULT_ADS_SETTINGS.slots,
  }
}

/** Atualiza o toggle de ads e os IDs de slot — sem precisar de deploy. */
export async function setAdsSettings(next: AdsSettings): Promise<AdsSettings> {
  const s = await prisma.appSettings.findUnique({ where: { id: SINGLETON_ID } })
  const flags = (s?.featureFlags as Record<string, unknown> | null) ?? {}
  const updatedFlags = { ...flags, ads: next } as unknown as Prisma.InputJsonValue

  await prisma.appSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, featureFlags: updatedFlags },
    update: { featureFlags: updatedFlags },
  })

  return next
}
