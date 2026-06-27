import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import {
  getVinhetaKey, setVinhetaKey,
  getVinhetaDownloadKey, setVinhetaDownloadKey,
} from '@/lib/settings/vinheta'

// ============================================================
// GET /api/admin/settings/vinheta — estado atual das duas vinhetas
// (player — enfileirada dinamicamente; download — colada no arquivo)
// ============================================================

export const GET = withRole('ADMIN', async () => {
  const [vinhetaKey, vinhetaDownloadKey] = await Promise.all([
    getVinhetaKey(),
    getVinhetaDownloadKey(),
  ])
  return apiSuccess({ vinhetaKey, vinhetaDownloadKey })
})

// ============================================================
// POST /api/admin/settings/vinheta — define uma das vinhetas
// (storageKey vindo do upload direto pro R2, kind 'audio')
// ============================================================

const bodySchema = z.object({
  storageKey: z.string().min(1).nullable(),
  target: z.enum(['player', 'download']).default('player'),
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

  const { storageKey, target } = parsed.data

  if (target === 'download') {
    const vinhetaDownloadKey = await setVinhetaDownloadKey(storageKey)
    return apiSuccess({ vinhetaDownloadKey })
  }

  const vinhetaKey = await setVinhetaKey(storageKey)
  return apiSuccess({ vinhetaKey })
})
