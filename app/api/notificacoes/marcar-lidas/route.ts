import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { markNotificationsRead } from '@/lib/notifications/notifications'

// ============================================================
// POST /api/notificacoes/marcar-lidas — marca todas (ou ids específicos) como lidas
// ============================================================

const bodySchema = z.object({ ids: z.array(z.string().uuid()).optional() })

export const POST = withAuth(async (request: NextRequest, auth) => {
  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')

  await markNotificationsRead(auth.userId, parsed.data.ids)
  return apiSuccess({ ok: true })
})
