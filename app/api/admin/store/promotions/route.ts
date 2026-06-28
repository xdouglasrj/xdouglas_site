import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

const bodySchema = z.object({
  label: z.string().min(1).max(120),
  multiplier: z.number().min(1).max(10),
  // Ou data específica (startAt/endAt) ou dia da semana recorrente (weekday) — não os dois
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  weekday: z.number().int().min(0).max(6).optional(),
})

// GET /api/admin/store/promotions — lista todas (ativas e inativas)
export const GET = withRole('ADMIN', async () => {
  const promotions = await prisma.pointsPromotion.findMany({ orderBy: { createdAt: 'desc' } })
  return apiSuccess({ promotions })
})

// POST /api/admin/store/promotions — cria multiplicador de XP por data ou dia da semana
export const POST = withRole('ADMIN', async (request) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')

  const { label, multiplier, startAt, endAt, weekday } = parsed.data
  if (weekday === undefined && !startAt && !endAt) {
    return apiError('Informe um dia da semana ou um período de datas', 400, 'MISSING_RANGE')
  }

  const promotion = await prisma.pointsPromotion.create({
    data: {
      label,
      multiplier,
      weekday: weekday ?? null,
      startAt: weekday === undefined && startAt ? new Date(startAt) : null,
      endAt: weekday === undefined && endAt ? new Date(endAt) : null,
    },
  })

  return apiSuccess({ promotion })
})
