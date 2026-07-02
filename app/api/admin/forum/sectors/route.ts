import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { listAllSectors, createSector } from '@/lib/forum/forum'

// ============================================================
// GET /api/admin/forum/sectors — lista todos os setores (admin)
// POST /api/admin/forum/sectors — cria um setor
// ============================================================

export const GET = withRole('ADMIN', async () => {
  const sectors = await listAllSectors()
  return apiSuccess({ sectors })
})

const createSchema = z.object({
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen'),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).optional(),
  order: z.number().int().min(0).optional(),
  onlyAdminPost: z.boolean().optional(),
})

export const POST = withRole('ADMIN', async (request: NextRequest) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')

  try {
    const sector = await createSector(parsed.data)
    return apiSuccess({ sector }, 201)
  } catch {
    return apiError('Já existe um setor com esse slug', 409, 'DUPLICATE_SLUG')
  }
})
