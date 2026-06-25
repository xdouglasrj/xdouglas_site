import { withRole, apiSuccess } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import { seedFictionalLaunchContent } from '@/lib/dev/seed-fictional-launch-content'

// ============================================================
// POST /api/admin/seed-fictional-content
//
// Popula músicas, artistas, usuários, posts e comentários
// FICTÍCIOS de lançamento (ver lib/dev/seed-fictional-launch-content.ts).
// Idempotente — pode ser chamada mais de uma vez sem duplicar nada.
// Acionada manualmente pelo admin em /admin/configuracoes.
// ============================================================

export const POST = withRole('ADMIN', async () => {
  const result = await seedFictionalLaunchContent(prisma)
  return apiSuccess(result)
})
