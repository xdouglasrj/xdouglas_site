interface SocialLinksProps {
  instagramUrl?: string | null
  youtubeUrl?: string | null
  tiktokUrl?: string | null
  websiteUrl?: string | null
}

// Validação de URL no momento da exibição — defesa em profundidade. O
// servidor já valida http/https em app/api/perfil/route.ts (isHttpUrl),
// mas nunca renderizamos um href sem revalidar aqui (dado pode ter sido
// escrito antes desta validação existir, ou por outro caminho).
function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const LINKS: Array<{ key: keyof SocialLinksProps; label: string; path: string }> = [
  { key: 'instagramUrl', label: 'Instagram', path: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm0 2A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5zm4.75-3.75a1 1 0 1 1-1 1 1 1 0 0 1 1-1z' },
  { key: 'youtubeUrl', label: 'YouTube', path: 'M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.9 4 12 4 12 4h0s-3.9 0-6.7.2c-.4 0-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2.2 9 2.2 10.7v1.5C2.2 14 2.4 15.7 2.4 15.7s.2 1.5.8 2.1c.8.8 1.9.8 2.3.9 1.7.2 7.5.2 7.5.2s3.9 0 6.7-.2c.4 0 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.7.2-3.5v-1.5c0-1.7-.2-3.5-.2-3.5zM9.9 14.6V8.9l5.4 2.9z' },
  { key: 'tiktokUrl', label: 'TikTok', path: 'M16.6 5.8a4.5 4.5 0 0 1-3.8-4h-3v12.3a2.7 2.7 0 1 1-1.9-2.6V8.4a5.7 5.7 0 1 0 4.9 5.6V9.8a7.4 7.4 0 0 0 4.3 1.4V8.2a4.5 4.5 0 0 1-.5-2.4z' },
  { key: 'websiteUrl', label: 'Site', path: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm7.9 9h-3.2a15.6 15.6 0 0 0-1.2-5.4A8 8 0 0 1 19.9 11zM12 4a13.4 13.4 0 0 1 1.7 7h-3.4A13.4 13.4 0 0 1 12 4zM4.1 11a8 8 0 0 1 4.4-6.4A15.6 15.6 0 0 0 7.3 11zm0 2h3.2a15.6 15.6 0 0 0 1.2 5.4A8 8 0 0 1 4.1 13zM12 20a13.4 13.4 0 0 1-1.7-7h3.4A13.4 13.4 0 0 1 12 20zm2.5-.4A15.6 15.6 0 0 0 15.7 13h3.2a8 8 0 0 1-4.4 6.6z' },
]

// Ícones de redes sociais do perfil público — só renderiza links válidos
// (http/https) e sempre com rel="nofollow noopener" (não repassa link
// juice de SEO para site externo e evita window.opener hijack).
export function SocialLinks({ instagramUrl, youtubeUrl, tiktokUrl, websiteUrl }: SocialLinksProps) {
  const values: SocialLinksProps = { instagramUrl, youtubeUrl, tiktokUrl, websiteUrl }
  const visible = LINKS.filter((link) => {
    const url = values[link.key]
    return !!url && isHttpUrl(url)
  })

  if (visible.length === 0) return null

  return (
    <div className="flex items-center gap-3">
      {visible.map((link) => (
        <a
          key={link.key}
          href={values[link.key] as string}
          target="_blank"
          rel="nofollow noopener"
          aria-label={link.label}
          title={link.label}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gate-azure bg-white/5 text-white/70 transition hover:text-gate-pink hover:border-gate-pink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={link.path} />
          </svg>
        </a>
      ))}
    </div>
  )
}
