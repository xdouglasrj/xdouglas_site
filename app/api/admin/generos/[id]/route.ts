import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

// ============================================================
// PUT /api/admin/generos/[id] — edita nome/slug/ordem/ativo
// ============================================================

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
})

export const PUT = withRole('ADMIN', async (request: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Body inválido', 400, 'INVALID_BODY')
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 400, 'VALIDATION_ERROR')
  }

  if (parsed.data.slug) {
    const existing = await prisma.genre.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } })
    if (existing) return apiError('Já existe um gênero com esse slug', 409, 'SLUG_TAKEN')
  }

  try {
    const genre = await prisma.genre.update({ where: { id }, data: parsed.data })
    return apiSuccess({ genre })
  } catch {
    return apiError('Gênero não encontrado', 404, 'NOT_FOUND')
  }
})

// ============================================================
// DELETE /api/admin/generos/[id]
// Bloqueia exclusão se houver subgêneros ou músicas vinculadas —
// usar "desativar" nesses casos para não quebrar referências.
// ============================================================

export const DELETE = withRole('ADMIN', async (_req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const [childrenCount, tracksCount] = await Promise.all([
    prisma.genre.count({ where: { parentId: id } }),
    prisma.track.count({ where: { genreId: id } }),
  ])

  if (childrenCount > 0) return apiError('Remova os subgêneros antes de excluir esta categoria', 409, 'HAS_CHILDREN')
  if (tracksCount > 0) return apiError('Existem músicas usando este gênero — desative em vez de excluir', 409, 'IN_USE')

  try {
    await prisma.genre.delete({ where: { id } })
    return apiSuccess({ ok: true })
  } catch {
    return apiError('Gênero não encontrado', 404, 'NOT_FOUND')
  }
})
