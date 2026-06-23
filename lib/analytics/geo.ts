export interface GeoLocation {
  country?: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
}

interface IpApiResponse {
  status: 'success' | 'fail'
  country?: string
  regionName?: string
  city?: string
  lat?: number
  lon?: number
}

/**
 * Resolve geolocalização a partir do IP.
 * Retorna objeto vazio em caso de falha — nunca quebra o fluxo principal.
 */
export async function resolveGeo(ip: string): Promise<GeoLocation> {
  // IPs locais não têm geo
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
    return {}
  }

  try {
    const apiUrl = process.env.IP_API_URL ?? 'http://ip-api.com/json'
    const res = await fetch(`${apiUrl}/${ip}?fields=status,country,regionName,city,lat,lon`, {
      signal: AbortSignal.timeout(2000), // 2s timeout
    })

    if (!res.ok) return {}

    const data: IpApiResponse = await res.json()

    if (data.status !== 'success') return {}

    return {
      country: data.country,
      region: data.regionName,
      city: data.city,
      latitude: data.lat,
      longitude: data.lon,
    }
  } catch {
    return {}
  }
}

/**
 * Extrai o IP real da requisição considerando proxies e Cloudflare.
 */
export function extractIp(request: Request): string | undefined {
  return (
    request.headers.get('cf-connecting-ip') ??      // Cloudflare
    request.headers.get('x-real-ip') ??             // Nginx proxy
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    undefined
  )
}
