import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { getAutoAcceptSettings, setAutoAccept } from '@/lib/settings/auto-accept'

// ============================================================
// GET /api/admin/settings/auto-accept — estado atual
// ============================================================

export const GET = withRole('ADMIN', async () => {
  const settings = await getAutoAcceptSettings()
  return apiSuccess(settings)
})

// ============================================================
// POST /api/admin/settings/auto-accept — liga/desliga + limite
// ============================================================

const bodySchema = z.object({
  enabled: z.boolean(),
  limit: z.number().int().min(0).max(100000),
})

export const POST = withRole('ADMIN', async (req: NextRequest) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const settings = await setAutoAccept(parsed.data.enabled, parsed.data.limit)
  return apiSuccess(settings)
})
