import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { createThread, listThreads } from '@/lib/forum/forum'

// ============================================================
// GET /api/forum/threads?page=1 — lista tópicos
// ============================================================

export const GET = withAuth(async (request: NextRequest) => {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const { threads, totalPages } = await listThreads(page)
  return apiSuccess({ threads, page, totalPages })
})

// ============================================================
// POST /api/forum/threads — cria um tópico
// ============================================================

const bodySchema = z.object({
  title: z.string().trim().min(3, 'Título muito curto').max(160),
  body: z.string().trim().min(1, 'Escreva o conteúdo do tópico').max(5000),
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

  const thread = await createThread(auth.userId, parsed.data.title, parsed.data.body)
  return apiSuccess({ thread }, 201)
})
