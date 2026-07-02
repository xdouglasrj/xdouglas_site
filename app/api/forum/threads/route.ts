import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { isFeatureEnabled } from '@/lib/settings/feature-flags'
import { createThread, listThreads, listThreadsBySector } from '@/lib/forum/forum'
import { prisma } from '@/lib/prisma'

// ============================================================
// GET /api/forum/threads?page=1&sectorId=<id> — lista tópicos (geral ou de um setor)
// ============================================================

export const GET = withAuth(async (request: NextRequest) => {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const sectorId = request.nextUrl.searchParams.get('sectorId')

  const { threads, totalPages } = sectorId ? await listThreadsBySector(sectorId, page) : await listThreads(page)
  return apiSuccess({ threads, page, totalPages })
})

// ============================================================
// POST /api/forum/threads — cria um tópico (exige setor)
// ============================================================

const bodySchema = z.object({
  title: z.string().trim().min(3, 'Título muito curto').max(160),
  body: z.string().trim().min(1, 'Escreva o conteúdo do tópico').max(5000),
  sectorId: z.string().uuid('Setor obrigatório'),
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

  if (!(await isFeatureEnabled('postar_forum'))) {
    return apiError('Postar no fórum está desativado no momento', 403, 'FEATURE_DISABLED')
  }

  const sector = await prisma.forumSector.findUnique({ where: { id: parsed.data.sectorId } })
  if (!sector || !sector.active) return apiError('Setor inválido', 400, 'INVALID_SECTOR')
  if (sector.onlyAdminPost && auth.role !== 'ADMIN') {
    return apiError('Só o time xDouglas pode postar neste setor', 403, 'ADMIN_ONLY_SECTOR')
  }

  const thread = await createThread(auth.userId, parsed.data.title, parsed.data.body, parsed.data.sectorId)
  return apiSuccess({ thread }, 201)
})
