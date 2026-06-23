import { prisma } from '@/lib/prisma'
import { getActiveHashKey, hashIp } from './hash'
import type { EventContext } from './types'
import type { EventType } from '@prisma/client'

// ============================================================
// Registro de evento — grava nas duas camadas em paralelo
// ============================================================

export async function trackEvent(
  eventType: EventType,
  context: EventContext
): Promise<void> {
  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // +90 dias

    // Camada 1: com IP hash (retenção 90 dias)
    const rawPromise = (async () => {
      let ipHash: string | undefined
      let hashKeyId: string | undefined

      if (context.ip) {
        const hashKey = await getActiveHashKey()
        ipHash = hashIp(context.ip, hashKey.saltEncrypted)
        hashKeyId = hashKey.id
      }

      await prisma.analyticsRawEvent.create({
        data: {
          eventType,
          ipHash,
          hashKeyId,
          userAgent: context.userAgent,
          device: context.device,
          browser: context.browser,
          os: context.os,
          referer: context.referer,
          country: context.country,
          region: context.region,
          city: context.city,
          latitude: context.latitude,
          longitude: context.longitude,
          sessionId: context.sessionId,
          trackId: context.trackId,
          metadata: context.metadata as never,
          expiresAt,
        },
      })
    })()

    // Camada 2: sem IP, permanente (base de todos os relatórios)
    const processedPromise = prisma.analyticsEvent.create({
      data: {
        eventType,
        country: context.country,
        region: context.region,
        city: context.city,
        device: context.device,
        browser: context.browser,
        os: context.os,
        sessionId: context.sessionId,
        trackId: context.trackId,
        metadata: context.metadata as never,
      },
    })

    await Promise.all([rawPromise, processedPromise])
  } catch (err) {
    // Analytics nunca deve quebrar a requisição principal
    console.error('[Analytics] Erro ao registrar evento:', err)
  }
}

// ============================================================
// Helpers de evento específicos
// ============================================================

export function trackPageView(context: EventContext) {
  return trackEvent('PAGE_VIEW', context)
}

export function trackMusicView(trackId: string, context: EventContext) {
  return trackEvent('MUSIC_VIEW', { ...context, trackId })
}

export function trackDownloadStart(trackId: string, context: EventContext) {
  return trackEvent('DOWNLOAD_START', { ...context, trackId })
}

export function trackDownloadComplete(trackId: string, context: EventContext) {
  return trackEvent('DOWNLOAD_COMPLETE', { ...context, trackId })
}
