import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { getFeatureFlags, setFeatureFlags, FEATURE_FLAG_KEYS } from '@/lib/settings/feature-flags'

// ============================================================
// GET /api/admin/settings/feature-flags — estado atual de todas as flags
// POST /api/admin/settings/feature-flags — atualiza uma ou mais flags
// Exclusivo ADMIN (grupo "Configurações do site").
// ============================================================

export const GET = withRole('ADMIN', async () => {
  const flags = await getFeatureFlags()
  return apiSuccess({ flags })
})

const keySchema = z.enum(FEATURE_FLAG_KEYS)
const bodySchema = z.object({
  flags: z.record(keySchema, z.boolean()),
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

  const flags = await setFeatureFlags(parsed.data.flags)
  return apiSuccess({ flags })
})
