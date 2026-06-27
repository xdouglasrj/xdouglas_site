import { prisma } from '@/lib/prisma'
import { getStorage } from '@/lib/storage'

// Vídeos anexados a chamados de suporte são apagados do storage após 7 dias —
// o texto do chamado e a foto (se houver) continuam no histórico normalmente.
export const SUPPORT_VIDEO_RETENTION_DAYS = 7

export function videoRetentionCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - SUPPORT_VIDEO_RETENTION_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Apaga do storage os vídeos de chamados com mais de 7 dias e limpa as
 * referências (key/url) no banco. O ticket, a mensagem e o tipo do anexo
 * (VIDEO) permanecem — só o arquivo em si deixa de existir.
 */
export async function cleanupExpiredSupportVideos(now: Date = new Date()): Promise<{
  deleted: number
  ranAt: string
}> {
  const cutoff = videoRetentionCutoff(now)

  const expired = await prisma.supportTicket.findMany({
    where: {
      attachmentType: 'VIDEO',
      attachmentKey: { not: null },
      createdAt: { lt: cutoff },
    },
    select: { id: true, attachmentKey: true },
  })

  if (expired.length === 0) {
    return { deleted: 0, ranAt: now.toISOString() }
  }

  const storage = getStorage()

  for (const ticket of expired) {
    if (!ticket.attachmentKey) continue
    try {
      await storage.delete(ticket.attachmentKey)
    } catch (err) {
      console.error(`[SupportCleanup] Falha ao apagar anexo ${ticket.attachmentKey}:`, err)
      continue
    }

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { attachmentKey: null, attachmentUrl: null },
    })
  }

  return { deleted: expired.length, ranAt: now.toISOString() }
}
