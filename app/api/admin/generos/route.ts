import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

// ============================================================
// GET /api/admin/generos — árvore completa (inclui inativos)
// ============================================================

export const GET = withRole('ADMIN', async () => {
  const genres = await prisma.genre.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })

  const parents = genres.filter((g) => !g.parentId)
  const tree = parents.map((parent) => ({
    ...parent,
    children: genres.filter((g) => g.parentId === parent.id),
  }))

  return apiSuccess({ genres: tree })
})

// ============================================================
// POST /api/admin/generos — cria categoria-mãe ou subgênero
// ============================================================

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Slug deve usar apenas letras minúsculas, números e hífen'),
  parentId: z.string().uuid().nullable().optional(),
  order: z.number().int().default(0),
})

export const POST = withRole('ADMIN', async (request: NextRequest) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  const existing = await prisma.genre.findUnique({ where: { slug: parsed.data.slug } })
  if (existing) return apiError('Já existe um gênero com esse slug', 409, 'SLUG_TAKEN')

  if (parsed.data.parentId) {
    const parent = await prisma.genre.findUnique({ where: { id: parsed.data.parentId } })
    if (!parent) return apiError('Categoria-mãe não encontrada', 400, 'INVALID_PARENT')
    if (parent.parentId) return apiError('Só é permitido um nível de subgênero', 400, 'INVALID_PARENT')
  }

  const genre = await prisma.genre.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      parentId: parsed.data.parentId ?? null,
      order: parsed.data.order,
    },
  })

  return apiSuccess({ genre }, 201)
})
