// ============================================================
// Parser de User-Agent
// Sem dependências externas — padrões cobrindo ~95% do tráfego real
// ============================================================

export interface ParsedUA {
  browser: string
  os: string
  device: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown'
}

export function parseUserAgent(ua: string | null | undefined): ParsedUA {
  if (!ua) return { browser: 'unknown', os: 'unknown', device: 'unknown' }

  const s = ua.toLowerCase()

  // ── Device ────────────────────────────────────────────────
  let device: ParsedUA['device'] = 'desktop'

  if (
    /bot|crawler|spider|scraper|slurp|bingbot|googlebot|yandex|duckduck|baiduspider/i.test(ua)
  ) {
    device = 'bot'
  } else if (/ipad|tablet|kindle|silk|playbook/i.test(s)) {
    device = 'tablet'
  } else if (
    /mobile|android(?!.*tablet)|iphone|ipod|blackberry|windows phone|opera mini|iemobile/i.test(s)
  ) {
    device = 'mobile'
  }

  // ── Browser ───────────────────────────────────────────────
  let browser = 'other'

  if (/edg\//i.test(ua)) {
    browser = 'Edge'
  } else if (/opr\/|opera/i.test(ua)) {
    browser = 'Opera'
  } else if (/chrome\/|crios\//i.test(ua) && !/chromium/i.test(ua)) {
    browser = 'Chrome'
  } else if (/firefox\/|fxios\//i.test(ua)) {
    browser = 'Firefox'
  } else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari'
  } else if (/msie|trident/i.test(ua)) {
    browser = 'IE'
  } else if (/samsung/i.test(ua)) {
    browser = 'Samsung'
  }

  // ── OS ────────────────────────────────────────────────────
  let os = 'other'

  if (/windows nt/i.test(ua)) {
    os = 'Windows'
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS'
  } else if (/mac os x|macos/i.test(ua)) {
    os = 'macOS'
  } else if (/android/i.test(ua)) {
    os = 'Android'
  } else if (/linux/i.test(ua)) {
    os = 'Linux'
  } else if (/cros/i.test(ua)) {
    os = 'ChromeOS'
  }

  return { browser, os, device }
}
