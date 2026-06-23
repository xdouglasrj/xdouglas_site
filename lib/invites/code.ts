import crypto from 'crypto'

// ============================================================
// Geração e mapeamento de convites
// ============================================================

// Categorias da waitlist que viram conta de músico/produtor (role ARTIST).
// As demais (OUVINTE, OUTRO) viram conta de ouvinte (role GUEST).
const ARTIST_CATEGORIES = ['DJ', 'PRODUTOR', 'ARTISTA', 'MUSICO']

export type RegisterType = 'artist' | 'visitor'

export interface InviteTarget {
  /** Tipo esperado no /api/auth/register */
  type: RegisterType
  /** Caminho da página de cadastro correspondente */
  path: '/cadastro/musico' | '/cadastro/ouvinte'
}

/** Define a página/tipo de cadastro a partir da categoria escolhida no convite. */
export function inviteTargetForCategory(tipoUsuario: string): InviteTarget {
  if (ARTIST_CATEGORIES.includes(tipoUsuario)) {
    return { type: 'artist', path: '/cadastro/musico' }
  }
  return { type: 'visitor', path: '/cadastro/ouvinte' }
}

/** Gera uma chave de convite legível e aleatória, ex: XD-3F7A-9C2E. */
export function generateInviteCode(): string {
  const raw = crypto.randomBytes(4).toString('hex').toUpperCase() // 8 chars
  return `XD-${raw.slice(0, 4)}-${raw.slice(4, 8)}`
}

/** Normaliza o código informado no cadastro (trim + maiúsculas). */
export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase()
}

/** Monta o link absoluto de cadastro com o código de convite. */
export function buildRegistrationUrl(
  baseUrl: string,
  target: InviteTarget,
  inviteCode: string
): string {
  const origin = baseUrl.replace(/\/$/, '')
  return `${origin}${target.path}?convite=${encodeURIComponent(inviteCode)}`
}
