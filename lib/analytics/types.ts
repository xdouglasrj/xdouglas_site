// ============================================================
// Tipos compartilhados do módulo de analytics
// ============================================================

export interface EventContext {
  ip?: string
  userAgent?: string
  device?: string
  browser?: string
  os?: string
  referer?: string
  country?: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
  sessionId?: string
  trackId?: string
  metadata?: Record<string, unknown>
}

// Payload enviado pelo client para /api/analytics
export interface ClientEventPayload {
  type: 'page_view' | 'music_view'
  sessionId: string
  trackId?: string
  path: string
  referrer?: string
}
