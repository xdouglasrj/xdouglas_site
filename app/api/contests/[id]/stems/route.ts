import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import { getStorage } from '@/lib/storage'

// ============================================================
// POST /api/contests/[id]/stems — gera URL assinada para baixar o
// pacote de stems de um contest.
//
// Mesma regra de download da leva anterior (Plano 12/download geral):
// exige conta MEMBER ou superior — visitante anônimo e ouvintes (role
// GUEST) veem a página do contest mas caem no popup de login/upgrade
// para baixar. O storageKey NUNCA é exposto — só a URL temporária.
// ============================================================

export const POST = withRole('MEMBER', async (_req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  const contest = await prisma.contest.findUnique({
    where: { id },
    select: { published: true, stemsKey: true },
  })
  if (!contest || !contest.published) {
    return apiError('Concurso não encontrado', 404, 'NOT_FOUND')
  }
  if (!contest.stemsKey) {
    return apiError('Este concurso não tem stems para download', 404, 'NO_STEMS')
  }

  try {
    const storage = getStorage()
    const { downloadUrl, expiresAt } = await storage.getSignedDownloadUrl(contest.stemsKey, 900, 'private')
    return apiSuccess({ downloadUrl, expiresAt: expiresAt.toISOString() })
  } catch (err) {
    console.error('[contests/stems]', err)
    return apiError('Erro ao gerar link de download', 500, 'STORAGE_ERROR')
  }
})
