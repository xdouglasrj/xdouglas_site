// Só aceita caminhos internos (começando com "/", sem virar redirect
// aberto para outro domínio via "//host" ou "/\host").
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null
  return next
}
