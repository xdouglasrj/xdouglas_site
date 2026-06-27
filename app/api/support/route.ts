import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { createTicket } from '@/lib/support/support'

// ============================================================
// POST /api/support — abre um chamado de suporte
// ============================================================

const bodySchema = z.object({
  category: z.enum(['BUG', 'SUGESTAO', 'DUVIDA', 'OUTRO']),
  message: z.string().trim().min(10, 'Conte um pouco mais sobre o problema').max(2000),
  attachment: z
    .object({
      key: z.string().min(1),
      url: z.string().min(1),
      type: z.enum(['IMAGE', 'VIDEO']),
    })
    .optional(),
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
    return apiError(parsed.error.issues[0]?.message ?? 'Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const ticket = await createTicket(auth.userId, parsed.data.category, parsed.data.message, parsed.data.attachment)
  return apiSuccess({ ticket }, 201)
})
