import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/auth/guard'
import { withPermission } from '@/lib/auth/permissions'
import { flagInviteAbuse } from '@/lib/invites/abuse'

// ============================================================
// POST /api/admin/waitlist/[id]/flag-abuse
//
// Marca a indicação ligada a essa entrada como suspeita/abusiva.
// Escala 3 níveis (cancela pontos -> bloqueia convidar -> suspende
// conta) — critérios editáveis em /admin/loja (AppSettings).
// ============================================================

export const POST = withPermission('convites.gerenciar', async (_req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  try {
    const result = await flagInviteAbuse(id)
    return apiSuccess(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao marcar abuso'
    return apiError(message, 400, 'FLAG_ABUSE_FAILED')
  }
})
