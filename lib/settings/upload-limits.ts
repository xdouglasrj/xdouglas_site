import { prisma } from '@/lib/prisma'

const SINGLETON_ID = 'singleton'

export interface UploadLimitsSettings {
  musicMaxSizeMb: number
  podcastMaxSizeMb: number
  podcastEnabled: boolean
}

/** Lê os limites de upload de áudio configurados pelo admin. */
export async function getUploadLimits(): Promise<UploadLimitsSettings> {
  const s = await prisma.appSettings.findUnique({ where: { id: SINGLETON_ID } })
  return {
    musicMaxSizeMb: s?.musicMaxSizeMb ?? 20,
    podcastMaxSizeMb: s?.podcastMaxSizeMb ?? 100,
    podcastEnabled: s?.podcastEnabled ?? false,
  }
}

/** Atualiza os limites de upload de áudio (e liga/desliga o upload de podcast). */
export async function setUploadLimits(
  data: Partial<UploadLimitsSettings>
): Promise<UploadLimitsSettings> {
  const s = await prisma.appSettings.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      musicMaxSizeMb: data.musicMaxSizeMb ?? 20,
      podcastMaxSizeMb: data.podcastMaxSizeMb ?? 100,
      podcastEnabled: data.podcastEnabled ?? false,
    },
    update: {
      ...(data.musicMaxSizeMb !== undefined && { musicMaxSizeMb: data.musicMaxSizeMb }),
      ...(data.podcastMaxSizeMb !== undefined && { podcastMaxSizeMb: data.podcastMaxSizeMb }),
      ...(data.podcastEnabled !== undefined && { podcastEnabled: data.podcastEnabled }),
    },
  })

  return {
    musicMaxSizeMb: s.musicMaxSizeMb,
    podcastMaxSizeMb: s.podcastMaxSizeMb,
    podcastEnabled: s.podcastEnabled,
  }
}
