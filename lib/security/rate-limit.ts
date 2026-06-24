// ============================================================
// Rate Limiting
// ============================================================
// Fase 1: implementação em memória (suficiente para MVP single-instance)
// Fase 2: migrar para Redis quando escalar (interface mantida)
// Cloudflare rate limit no edge é a primeira linha de defesa.
// ============================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Store em memória — resetado ao reiniciar o processo
const store = new Map<string, RateLimitEntry>()

// Limpa entradas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

interface RateLimitConfig {
  windowMs: number  // janela em ms
  maxRequests: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    // Janela nova
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now + config.windowMs),
    }
  }

  existing.count++

  return {
    allowed: existing.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - existing.count),
    resetAt: new Date(existing.resetAt),
  }
}

// ============================================================
// Configurações pré-definidas
// ============================================================

/** Downloads: 10 por hora por IP hash */
export function downloadRateLimit(ipHash: string): RateLimitResult {
  return checkRateLimit(`download:${ipHash}`, {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10,
  })
}

/** API admin: 5 tentativas de login por 15 min */
export function loginRateLimit(ipHash: string): RateLimitResult {
  return checkRateLimit(`login:${ipHash}`, {
    windowMs: 15 * 60 * 1000, // 15 min
    maxRequests: 5,
  })
}

/** Streaming (ouvir): 60 por hora por IP hash — mais generoso que download */
export function streamRateLimit(ipHash: string): RateLimitResult {
  return checkRateLimit(`stream:${ipHash}`, {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 60,
  })
}

/** Waitlist: 3 submissões por IP por hora (anti-spam) */
export function waitlistRateLimit(ipHash: string): RateLimitResult {
  return checkRateLimit(`waitlist:${ipHash}`, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  })
}

/** Esqueci a senha: 3 pedidos por IP por hora (evita spam de email) */
export function forgotPasswordRateLimit(ipHash: string): RateLimitResult {
  return checkRateLimit(`forgot-password:${ipHash}`, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  })
}

/** Consulta do status do link de redefinição: 20 por IP por hora (apenas leitura) */
export function resetPasswordCheckRateLimit(ipHash: string): RateLimitResult {
  return checkRateLimit(`reset-password-check:${ipHash}`, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
  })
}
