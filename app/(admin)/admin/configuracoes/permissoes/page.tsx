import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { AdminSearchBar } from '@/components/admin/admin-search-bar'
import { PermissionsPanel, type PermissionsPanelUser } from './permissions-preview-panel'

export const metadata: Metadata = { title: 'Permissões de moderador' }
export const dynamic = 'force-dynamic'

const SEARCH_RESULTS_LIMIT = 20

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminPermissoesPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const users: PermissionsPanelUser[] = query
    ? (
        await prisma.user.findMany({
          where: {
            role: { not: 'ADMIN' },
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { artisticName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: SEARCH_RESULTS_LIMIT,
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            artisticName: true,
            role: true,
            permissions: true,
          },
        })
      ).map((u) => ({
        id: u.id,
        displayName: u.name || u.artisticName || u.username || u.email,
        username: u.username,
        artisticName: u.artisticName,
        email: u.email,
        role: u.role,
        permissions: u.permissions,
      }))
    : []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/configuracoes" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← Configurações
        </Link>
        <h1 className="text-xl font-semibold text-white mt-2">Permissões de moderador</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-xl">
          Busque um usuário, marque as permissões e salve. A primeira permissão atribuída
          promove o usuário a MODERATOR; remover todas rebaixa de volta a MEMBER.
        </p>
      </div>

      <AdminSearchBar defaultValue={query} placeholder="Buscar por nome de usuário, nome artístico ou email..." />

      {!query && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm">Digite algo na busca para ver um usuário e a grade de permissões.</p>
        </div>
      )}

      {query && users.length === 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm">Nenhum usuário encontrado para &quot;{query}&quot;.</p>
        </div>
      )}

      {query && users.length > 0 && <PermissionsPanel users={users} />}
    </div>
  )
}
