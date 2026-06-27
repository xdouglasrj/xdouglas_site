import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { getStorage } from '@/lib/storage'
import { getVinhetaKey } from '@/lib/settings/vinheta'

// ============================================================
// GET /api/vinheta
//
// Vinheta tocada dinamicamente pelo player ao fim de cada faixa
// (mesmo arquivo pra todo mundo — sem rate limit por faixa, já
// que não é conteúdo autoral protegido por download). Disponível
// pra qualquer conta logada, igual ao /api/stream.
// ============================================================

const VINHETA_URL_TTL_SECONDS = 10 * 60

export const GET = withRole('GUEST', async () => {
  const key = await getVinhetaKey()
  if (!key) {
    return apiError('Nenhuma vinheta configurada', 404, 'NOT_CONFIGURED')
  }

  try {
    const storage = getStorage()
    const { downloadUrl, expiresAt } = await storage.getSignedDownloadUrl(
      key,
      VINHETA_URL_TTL_SECONDS,
      'private'
    )
    return apiSuccess({ streamUrl: downloadUrl, expiresAt: expiresAt.toISOString() })
  } catch (err) {
    console.error('[vinheta]', err)
    return apiError('Erro ao gerar URL da vinheta', 503, 'STORAGE_ERROR')
  }
})
