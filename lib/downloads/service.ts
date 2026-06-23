import { prisma } from '@/lib/prisma'
import { getStorage } from '@/lib/storage'
import { downloadRateLimit, streamRateLimit } from '@/lib/security/rate-limit'
import { isSuspiciousDownload } from '@/lib/security/detect-bot'
import { trackEvent } from '@/lib/analytics/events'
import { buildEventContext } from '@/lib/analytics/context'
import { getActiveHashKey, hashIp } from '@/lib/analytics/hash'
import { extractIp } from '@/lib/analytics/geo'
import type { NextRequest } from 'next/server'

// ============================================================
// Constantes
// ============================================================

const DOWNLOAD_URL_TTL_SECONDS = 15 * 60 // 15 minutos
const STREAM_URL_TTL_SECONDS = 30 * 60   // 30 minutos — dá tempo de ouvir a faixa toda

// ============================================================
// Tipos
// ============================================================

export interface DownloadResult {
  downloadUrl: string
  expiresAt: string   // ISO string
  downloadId: string
  suspicious: boolean
}

export interface DownloadError {
  code:
    | 'NOT_FOUND'
    | 'NOT_PUBLISHED'
    | 'RATE_LIMITED'
    | 'STORAGE_ERROR'
    | 'INTERNAL_ERROR'
  message: string
  retryAfter?: string // ISO string, presente em RATE_LIMITED
}

// ============================================================
// Serviço principal
// ============================================================

export async function processDownload(
  trackId: string,
  request: NextRequest
): Promise<{ ok: true; data: DownloadResult } | { ok: false; error: DownloadError }> {

  // ── 1. Extrai contexto da requisição ─────────────────────
  const ip = extractIp(request)
  const userAgent = request.headers.get('user-agent')
  const ctx = await buildEventContext(request, { trackId })

  // ── 2. Hash do IP para rate limit e persistência ─────────
  let ipHash: string | undefined
  if (ip) {
    try {
      const hashKey = await getActiveHashKey()
      ipHash = hashIp(ip, hashKey.saltEncrypted)
    } catch {
      // Continua sem ipHash — não bloqueia o download
    }
  }

  // ── 3. Rate limit — 10 downloads/hora por IP hash ────────
  const ipKey = ipHash ?? Buffer.from(ip ?? 'unknown').toString('base64').slice(0, 32)
  const rateLimit = downloadRateLimit(ipKey)

  // ── 4. Detecção de bot ───────────────────────────────────
  const suspicious = isSuspiciousDownload({
    userAgent,
    rateLimitExceeded: !rateLimit.allowed,
    hasIp: !!ip,
  })

  // Rate limit excedido: registra como suspeito e rejeita
  if (!rateLimit.allowed) {
    // Registra tentativa bloqueada em analytics (fire-and-forget)
    trackEvent('DOWNLOAD_FAILED', {
      ...ctx,
      metadata: { reason: 'RATE_LIMITED', trackId },
    }).catch(() => {})

    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Muitos downloads. Aguarde antes de tentar novamente.',
        retryAfter: rateLimit.resetAt.toISOString(),
      },
    }
  }

  // ── 5. Valida track no banco ─────────────────────────────
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: {
      id: true,
      title: true,
      published: true,
      audioKey: true,      // NUNCA vai para o frontend
      audioFormat: true,
    },
  })

  if (!track) {
    return {
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Música não encontrada.' },
    }
  }

  if (!track.published) {
    return {
      ok: false,
      error: { code: 'NOT_PUBLISHED', message: 'Música não disponível.' },
    }
  }

  // ── 6. Gera URL assinada no R2 ───────────────────────────
  let downloadUrl: string
  let signedUrlExpiry: Date
  const storage = getStorage()

  try {
    const signed = await storage.getSignedDownloadUrl(
      track.audioKey,
      DOWNLOAD_URL_TTL_SECONDS
    )
    downloadUrl = signed.downloadUrl
    signedUrlExpiry = signed.expiresAt
  } catch (err) {
    // Falha de storage — registra e retorna erro
    console.error('[Download] Falha ao gerar URL assinada:', err)

    trackEvent('DOWNLOAD_FAILED', {
      ...ctx,
      metadata: { reason: 'STORAGE_ERROR', trackId },
    }).catch(() => {})

    return {
      ok: false,
      error: {
        code: 'STORAGE_ERROR',
        message: 'Erro ao preparar o arquivo. Tente novamente.',
      },
    }
  }

  // ── 7. Persiste o registro de download ───────────────────
  // Download suspeito é registrado mas não bloqueado —
  // URLs assinadas têm TTL curto e o analytics filtra por flag.
  let downloadRecord
  try {
    downloadRecord = await prisma.$transaction(async (tx) => {
      // Cria o registro de download
      const download = await tx.download.create({
        data: {
          trackId: track.id,
          country: ctx.country,
          region: ctx.region,
          city: ctx.city,
          latitude: ctx.latitude,
          longitude: ctx.longitude,
          device: ctx.device,
          browser: ctx.browser,
          os: ctx.os,
          status: 'INICIADO',
          signedUrlExpiry,
          downloadSuspeito: suspicious,
        },
        select: { id: true },
      })

      // Incrementa contador na track (cache denormalizado)
      // Fonte de verdade permanece a tabela downloads
      if (!suspicious) {
        await tx.track.update({
          where: { id: track.id },
          data: { downloadCount: { increment: 1 } },
        })
      }

      return download
    })
  } catch (err) {
    console.error('[Download] Erro ao persistir registro:', err)
    // URL já gerada — retorna mesmo assim para não prejudicar o usuário
    // O analytics vai capturar a ausência do registro
  }

  // ── 8. Registra DOWNLOAD_START em analytics ──────────────
  // Fire-and-forget: nunca bloqueia a entrega da URL
  trackEvent('DOWNLOAD_START', {
    ...ctx,
    metadata: {
      trackId,
      downloadId: downloadRecord?.id,
      suspicious,
      format: track.audioFormat,
    },
  }).catch(() => {})

  return {
    ok: true,
    data: {
      downloadUrl,     // URL assinada R2 — nunca a audioKey
      expiresAt: signedUrlExpiry.toISOString(),
      downloadId: downloadRecord?.id ?? crypto.randomUUID(),
      suspicious,
    },
  }
}

// ============================================================
// Streaming (ouvir) — gera URL assinada para tocar a faixa
// inline no site, sem contar como download nem criar registro
// na tabela downloads. Disponível para qualquer conta logada.
// ============================================================

export interface StreamResult {
  streamUrl: string
  expiresAt: string
}

export interface StreamError {
  code: 'NOT_FOUND' | 'NOT_PUBLISHED' | 'RATE_LIMITED' | 'STORAGE_ERROR'
  message: string
  retryAfter?: string
}

export async function processStream(
  trackId: string,
  request: NextRequest
): Promise<{ ok: true; data: StreamResult } | { ok: false; error: StreamError }> {
  const ip = extractIp(request)

  let ipHash: string | undefined
  if (ip) {
    try {
      const hashKey = await getActiveHashKey()
      ipHash = hashIp(ip, hashKey.saltEncrypted)
    } catch {
      // Continua sem ipHash — não bloqueia o streaming
    }
  }

  const ipKey = ipHash ?? Buffer.from(ip ?? 'unknown').toString('base64').slice(0, 32)
  const rateLimit = streamRateLimit(ipKey)

  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Muitas reproduções. Aguarde antes de tentar novamente.',
        retryAfter: rateLimit.resetAt.toISOString(),
      },
    }
  }

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true, published: true, audioKey: true },
  })

  if (!track) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Música não encontrada.' } }
  }
  if (!track.published) {
    return { ok: false, error: { code: 'NOT_PUBLISHED', message: 'Música não disponível.' } }
  }

  try {
    const storage = getStorage()
    const signed = await storage.getSignedDownloadUrl(track.audioKey, STREAM_URL_TTL_SECONDS)

    return {
      ok: true,
      data: { streamUrl: signed.downloadUrl, expiresAt: signed.expiresAt.toISOString() },
    }
  } catch (err) {
    console.error('[Stream] Falha ao gerar URL assinada:', err)
    return {
      ok: false,
      error: { code: 'STORAGE_ERROR', message: 'Erro ao preparar a faixa. Tente novamente.' },
    }
  }
}
