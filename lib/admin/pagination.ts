export const ADMIN_PAGE_SIZE = 10

/** Converte o parâmetro de página da URL num inteiro válido (mínimo 1). */
export function parsePage(value?: string): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}
