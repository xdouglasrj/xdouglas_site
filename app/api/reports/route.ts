import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { createReport } from '@/lib/reports/reports'

// ============================================================
// POST /api/reports — denuncia um post, comentário, tópico, etc.
// ============================================================

const bodySchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'FORUM_THREAD', 'FORUM_REPLY', 'TRACK', 'USER']),
  targetId: z.string().min(1),
  reason: z.string().trim().min(3, 'Conte um pouco mais sobre a denúncia').max(500),
})

export const POST = withAuth(async (request: NextRequest, auth) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const report = await createReport(
    auth.userId,
    parsed.data.targetType,
    parsed.data.targetId,
    parsed.data.reason
  )
  return apiSuccess({ report }, 201)
})
