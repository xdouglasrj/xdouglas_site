import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { cancelHighlightWithRefund, HighlightError } from '@/lib/store/highlight-service'

// POST /api/admin/highlights/[id]/cancel — moderação: cancela um destaque
// pago e estorna os pontos ao dono (atômico). Só admin.
export const POST = withRole('ADMIN', async (_request, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  try {
    const result = await cancelHighlightWithRefund(id)
    return apiSuccess({ refunded: result.refunded })
  } catch (err) {
    if (err instanceof HighlightError) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400
      return apiError(err.message, status, err.code)
    }
    console.error('[Highlight] Falha ao cancelar', err)
    return apiError('Erro interno', 500, 'INTERNAL_ERROR')
  }
})
