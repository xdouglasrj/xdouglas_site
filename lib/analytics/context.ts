import type { NextRequest } from 'next/server'
import { extractIp, resolveGeo, type GeoLocation } from './geo'
import { parseUserAgent } from './ua-parser'
import type { EventContext } from './types'

export type { EventContext }

// ============================================================
// buildEventContext
// Ponto de entrada único para construir o contexto de analytics.
// Chamado nas API routes antes de trackEvent().
//
// Fluxo:
//   Request → IP → Geo (paralelo com UA parse) → EventContext
//
// A geo pode falhar (timeout, IP privado) — resultado parcial é válido.
// ============================================================

export async function buildEventContext(
  request: NextRequest,
  overrides?: Partial<EventContext>
): Promise<EventContext> {
  const ip = extractIp(request)
  const ua = request.headers.get('user-agent')
  const referer = request.headers.get('referer') ?? undefined

  // Parse de UA e geo em paralelo — geo pode levar até 2s
  const [geo, parsed] = await Promise.all([
    ip ? resolveGeo(ip) : Promise.resolve<GeoLocation>({}),
    Promise.resolve(parseUserAgent(ua)),
  ])

  return {
    ip,
    userAgent: ua ?? undefined,
    device: parsed.device,
    browser: parsed.browser,
    os: parsed.os,
    referer,
    country: geo.country,
    region: geo.region,
    city: geo.city,
    latitude: geo.latitude,
    longitude: geo.longitude,
    ...overrides,
  }
}
