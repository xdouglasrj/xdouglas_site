// ============================================================
// Detecção de downloads suspeitos
// ============================================================
// Critérios para flag download_suspeito = true:
//   - User-agent ausente ou de bot conhecido
//   - Rate limit excedido
//   - Padrão de download muito rápido (sem visualização prévia)
// ============================================================

const BOT_SIGNATURES = [
  /bot/i, /crawler/i, /spider/i, /scraper/i,
  /curl/i, /wget/i, /python-requests/i, /axios/i,
  /postman/i, /insomnia/i, /go-http-client/i,
  /java\//i, /ruby/i, /php/i,
]

export function isSuspiciousUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim().length < 10) return true
  return BOT_SIGNATURES.some((pattern) => pattern.test(userAgent))
}

interface SuspiciousCheckInput {
  userAgent?: string | null
  rateLimitExceeded: boolean
  hasIp: boolean
}

export function isSuspiciousDownload({
  userAgent,
  rateLimitExceeded,
  hasIp,
}: SuspiciousCheckInput): boolean {
  if (rateLimitExceeded) return true
  if (!hasIp) return true
  if (isSuspiciousUserAgent(userAgent)) return true
  return false
}
