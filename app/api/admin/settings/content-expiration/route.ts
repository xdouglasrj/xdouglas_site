import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import {
  CONTENT_EXPIRATION_OPTIONS,
  getContentExpirationHours,
  setContentExpirationHours,
} from '@/lib/settings/content-expiration'

// ============================================================
// GET /api/admin/settings/content-expiration — estado atual
// ============================================================

export const GET = withRole('ADMIN', async () => {
  const hours = await getContentExpirationHours()
  return apiSuccess({ hours })
})

// ============================================================
// POST /api/admin/settings/content-expiration — atualiza prazo
// ============================================================

const bodySchema = z.object({
  hours: z.number().int().refine((h) => (CONTENT_EXPIRATION_OPTIONS as readonly number[]).includes(h)),
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

  const hours = await setContentExpirationHours(parsed.data.hours)
  return apiSuccess({ hours })
})
