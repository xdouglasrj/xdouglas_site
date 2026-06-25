import { prisma } from '@/lib/prisma'

const SINGLETON_ID = 'singleton'

// Janelas de exibição pública aceitas — música/comentário some do
// catálogo/feed depois desse prazo, mas continua no banco (soft-hide).
export const CONTENT_EXPIRATION_OPTIONS = [24, 36, 48] as const
export type ContentExpirationHours = (typeof CONTENT_EXPIRATION_OPTIONS)[number]

const DEFAULT_HOURS: ContentExpirationHours = 24

/** Lê o prazo (em horas) configurado pelo admin para exibição pública. */
export async function getContentExpirationHours(): Promise<number> {
  const s = await prisma.appSettings.findUnique({ where: { id: SINGLETON_ID } })
  return s?.contentExpirationHours ?? DEFAULT_HOURS
}

/** Atualiza o prazo de exibição pública de músicas e comentários. */
export async function setContentExpirationHours(hours: number): Promise<number> {
  const s = await prisma.appSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, contentExpirationHours: hours },
    update: { contentExpirationHours: hours },
  })
  return s.contentExpirationHours
}

/** Data de corte — conteúdo criado/publicado antes disso já expirou. */
export async function getContentCutoffDate(): Promise<Date> {
  const hours = await getContentExpirationHours()
  return new Date(Date.now() - hours * 60 * 60 * 1000)
}
