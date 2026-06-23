'use client'

import { useAnalyticsContext } from './analytics-provider'

// ============================================================
// useAnalytics — interface pública para componentes de produto
//
// Uso:
//   const { trackMusicView } = useAnalytics()
//   <button onClick={() => trackMusicView(track.id)}>Download</button>
// ============================================================

export function useAnalytics() {
  const { track, hasConsent, giveConsent, revokeConsent, sessionId } =
    useAnalyticsContext()

  return {
    /** Dispara music_view para a música especificada */
    trackMusicView(trackId: string) {
      track('music_view', trackId)
    },

    /** Dispara page_view manualmente (normalmente automático) */
    trackPageView() {
      track('page_view')
    },

    /** Se o usuário deu consentimento */
    hasConsent,

    /** Dá consentimento e persiste no localStorage */
    giveConsent,

    /** Revoga consentimento e remove do localStorage */
    revokeConsent,

    /** SessionId anônimo atual */
    sessionId,
  }
}
