import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { isFeatureEnabled } from '@/lib/settings/feature-flags'
import { toggleFollow } from '@/lib/social/follow'
import { checkAndAwardProfileCompletion } from '@/lib/profile-completeness'

// ============================================================
// POST /api/social/follow — liga/desliga seguir outro usuário
// ============================================================

const bodySchema = z.object({
  userId: z.string().uuid(),
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

  if (parsed.data.userId === auth.userId) {
    return apiError('Não é possível seguir a si mesmo', 400, 'CANNOT_FOLLOW_SELF')
  }

  if (!(await isFeatureEnabled('seguir'))) {
    return apiError('Seguir está desativado no momento', 403, 'FEATURE_DISABLED')
  }

  try {
    const following = await toggleFollow(auth.userId, parsed.data.userId)

    // V3 Plano 9 — "seguir 3 perfis" é item do checklist de completude
    if (following) {
      checkAndAwardProfileCompletion(auth.userId).catch((err) =>
        console.error('[API /social/follow POST] Falha ao checar completude de perfil', err)
      )
    }

    return apiSuccess({ following })
  } catch {
    return apiError('Erro ao seguir/deixar de seguir', 500, 'FOLLOW_ERROR')
  }
})
