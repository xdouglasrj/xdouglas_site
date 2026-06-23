import { prisma } from '@/lib/prisma'

// ============================================================
// Cleanup de analytics_raw_events expirados
// LGPD: dados técnicos com IP hash retidos por no máximo 90 dias
//
// Estratégia de execução:
//   Fase 1: endpoint /api/analytics/cleanup protegido por CRON_SECRET
//           chamado por Vercel Cron ou serviço externo 1x/dia
//   Fase 2: job assíncrono dedicado quando o volume justificar
// ============================================================

export interface CleanupResult {
  deleted: number
  ranAt: string
}

export async function cleanupExpiredRawEvents(): Promise<CleanupResult> {
  const now = new Date()

  // Deleta em lotes de 1000 para não bloquear o banco
  let totalDeleted = 0
  const BATCH_SIZE = 1000

  while (true) {
    const batch = await prisma.analyticsRawEvent.findMany({
      where: { expiresAt: { lte: now } },
      select: { id: true },
      take: BATCH_SIZE,
    })

    if (batch.length === 0) break

    const ids = batch.map((r) => r.id)
    const { count } = await prisma.analyticsRawEvent.deleteMany({
      where: { id: { in: ids } },
    })

    totalDeleted += count

    // Sai do loop se deletou menos que o batch (chegou ao fim)
    if (batch.length < BATCH_SIZE) break
  }

  return {
    deleted: totalDeleted,
    ranAt: now.toISOString(),
  }
}
