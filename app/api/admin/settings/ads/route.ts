import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { getAdsSettings, setAdsSettings } from '@/lib/settings/ads'

// ============================================================
// GET /api/admin/settings/ads — estado atual (toggle + slot IDs)
// ============================================================

export const GET = withRole('ADMIN', async () => {
  const settings = await getAdsSettings()
  return apiSuccess(settings)
})

// ============================================================
// POST /api/admin/settings/ads — atualiza toggle e slot IDs
// ============================================================

const bodySchema = z.object({
  enabled: z.boolean(),
  slots: z.record(z.string(), z.string()),
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

  const settings = await setAdsSettings(parsed.data)
  return apiSuccess(settings)
})
