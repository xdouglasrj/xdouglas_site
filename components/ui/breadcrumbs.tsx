'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

// ============================================================
// Rótulos conhecidos por segmento de URL — fallback humaniza
// o slug bruto (troca "-" por espaço e capitaliza)
// ============================================================

const LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  musicas: 'Músicas',
  nova: 'Nova música',
  editar: 'Editar',
  convites: 'Pedidos recebidos',
  'convites-aceitos': 'Convites pendentes',
  cadastros: 'Cadastro ativo',
  waitlist: 'Lista de espera',
  login: 'Login',
  'esqueci-senha': 'Esqueci a senha',
  'redefinir-senha': 'Redefinir senha',
  inicio: 'Início',
  upload: 'Upload',
  perfil: 'Perfil',
  cadastro: 'Cadastro',
  musico: 'Músico',
  ouvinte: 'Ouvinte',
  privacidade: 'Privacidade',
}

function humanize(segment: string): string {
  if (LABELS[segment]) return LABELS[segment]
  try {
    const decoded = decodeURIComponent(segment)
    return decoded.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return segment
  }
}

interface BreadcrumbsProps {
  className?: string
}

// ============================================================
// Trilha de navegação — mostra em qual página o usuário está
// ============================================================

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  const crumbs = segments.map((seg, i) => ({
    label: humanize(seg),
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))

  return (
    <nav
      aria-label="Caminho de navegação"
      className={clsx('mb-4 flex flex-wrap items-center gap-1.5 text-xs text-gate-blue', className)}
    >
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden="true">/</span>}
          {crumb.isLast ? (
            <span className="font-medium text-white" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link href={crumb.href} className="transition-colors hover:text-gate-pink">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
