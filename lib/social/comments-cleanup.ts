import { prisma } from '@/lib/prisma'
import { getContentCutoffDate } from '@/lib/settings/content-expiration'

/**
 * Apaga em definitivo os comentários que já passaram do prazo de exibição
 * (mesmo prazo configurado pelo admin em getContentExpirationHours — 24h
 * por padrão). Até esse prazo eles só ficam ocultos das consultas (soft-hide);
 * este job é quem de fato libera o espaço no banco.
 */
export async function cleanupExpiredComments(): Promise<{
  deleted: number
  ranAt: string
}> {
  const cutoff = await getContentCutoffDate()

  const result = await prisma.comment.deleteMany({
    where: { createdAt: { lt: cutoff }, pinned: false },
  })

  return { deleted: result.count, ranAt: new Date().toISOString() }
}
