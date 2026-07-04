import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { highlightTrack, getHighlightCostInfo, HighlightError } from '@/lib/store/highlight-service'
import { InsufficientPointsError } from '@/lib/points/points-service'

// GET /api/tracks/[id]/highlight — info de custo/saldo/elegibilidade (não debita)
export const GET = withAuth(async (_request, auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  try {
    const info = await getHighlightCostInfo(id, auth.userId)
    return apiSuccess({ info })
  } catch (err) {
    console.error('[Highlight] Falha ao obter info', err)
    return apiError('Erro interno', 500, 'INTERNAL_ERROR')
  }
})

// POST /api/tracks/[id]/highlight — destaca a própria faixa gastando pontos.
// Débito + criação do highlight são atômicos (highlight-service).
export const POST = withAuth(async (_request, auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  try {
    const result = await highlightTrack(id, auth.userId)
    return apiSuccess({ highlight: result.highlight, remainingBalance: result.remainingBalance })
  } catch (err) {
    if (err instanceof InsufficientPointsError) {
      return apiError(err.message, 400, 'INSUFFICIENT_POINTS')
    }
    if (err instanceof HighlightError) {
      const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'NOT_OWNER' ? 403 : 400
      return apiError(err.message, status, err.code)
    }
    console.error('[Highlight] Falha ao destacar', err)
    return apiError('Erro interno', 500, 'INTERNAL_ERROR')
  }
})
