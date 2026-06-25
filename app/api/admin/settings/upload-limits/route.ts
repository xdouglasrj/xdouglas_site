import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { getUploadLimits, setUploadLimits } from '@/lib/settings/upload-limits'

// ============================================================
// GET /api/admin/settings/upload-limits — estado atual
// ============================================================

export const GET = withRole('ADMIN', async () => {
  const settings = await getUploadLimits()
  return apiSuccess(settings)
})

// ============================================================
// POST /api/admin/settings/upload-limits — atualiza limites/toggle
// ============================================================

const bodySchema = z.object({
  musicMaxSizeMb: z.number().int().min(1).max(2000).optional(),
  podcastMaxSizeMb: z.number().int().min(1).max(2000).optional(),
  podcastEnabled: z.boolean().optional(),
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

  const settings = await setUploadLimits(parsed.data)
  return apiSuccess(settings)
})
