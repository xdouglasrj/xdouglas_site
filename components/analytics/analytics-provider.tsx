'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'

// ============================================================
// Contexto
// ============================================================

type AnalyticsEventType =
  | 'page_view'
  | 'music_view'
  | 'play_start'
  | 'play_30s'
  | 'play_complete'

interface AnalyticsContextValue {
  sessionId: string | null
  hasConsent: boolean
  giveConsent: () => void
  revokeConsent: () => void
  track: (
    type: AnalyticsEventType,
    trackId?: string,
    metadata?: { durationSec?: number }
  ) => void
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

// ============================================================
// Constantes
// ============================================================

const SESSION_KEY = 'xd_sid'      // sessionStorage: ID da sessão anônima
const CONSENT_KEY = 'xd_consent'  // localStorage: consentimento persistente

// ============================================================
// Provider
// ============================================================

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [hasConsent, setHasConsent] = useState(false)
  const lastTrackedPath = useRef<string | null>(null)

  // Inicializa sessionId e lê consentimento ao montar
  useEffect(() => {
    // SessionId — anônimo, dura a sessão do browser (sessionStorage)
    let sid = sessionStorage.getItem(SESSION_KEY)
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, sid)
    }
    setSessionId(sid)

    // Consentimento persistente (localStorage)
    const consent = localStorage.getItem(CONSENT_KEY)
    if (consent === 'true') {
      setHasConsent(true)
    }
  }, [])

  // Dispara page_view a cada mudança de rota
  useEffect(() => {
    if (!sessionId || !hasConsent) return
    if (lastTrackedPath.current === pathname) return

    lastTrackedPath.current = pathname
    sendEvent('page_view', sessionId, { path: pathname })
  }, [pathname, sessionId, hasConsent])

  // ── Funções de consentimento ─────────────────────────────

  function giveConsent() {
    localStorage.setItem(CONSENT_KEY, 'true')
    setHasConsent(true)

    // Registra o evento de consentimento na API
    if (sessionId) {
      fetch('/api/analytics/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'CONSENT_GIVEN',
          consentType: 'analytics',
        }),
      }).catch(() => {})
    }
  }

  function revokeConsent() {
    localStorage.removeItem(CONSENT_KEY)
    setHasConsent(false)

    if (sessionId) {
      fetch('/api/analytics/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'CONSENT_REVOKED',
          consentType: 'analytics',
        }),
      }).catch(() => {})
    }
  }

  // ── Função de track ──────────────────────────────────────

  function track(
    type: AnalyticsEventType,
    trackId?: string,
    metadata?: { durationSec?: number }
  ) {
    if (!sessionId || !hasConsent) return
    sendEvent(type, sessionId, { path: pathname, trackId, metadata })
  }

  return (
    <AnalyticsContext.Provider
      value={{ sessionId, hasConsent, giveConsent, revokeConsent, track }}
    >
      {children}
    </AnalyticsContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useAnalyticsContext(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext)
  if (!ctx) {
    throw new Error('useAnalyticsContext deve ser usado dentro de AnalyticsProvider')
  }
  return ctx
}

// ============================================================
// Função interna de envio
// ============================================================

function sendEvent(
  type: AnalyticsEventType,
  sessionId: string,
  extra: { path: string; trackId?: string; metadata?: { durationSec?: number } }
) {
  const payload = {
    type,
    sessionId,
    path: extra.path,
    trackId: extra.trackId,
    referrer: document.referrer || undefined,
    metadata: extra.metadata,
  }

  // Usa sendBeacon quando disponível (não bloqueia unload da página)
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    })
    navigator.sendBeacon('/api/analytics', blob)
    return
  }

  // Fallback para fetch
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}
