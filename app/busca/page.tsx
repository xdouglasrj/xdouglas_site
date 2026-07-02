import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { Avatar } from '@/components/ui/avatar'
import { searchUsers } from '@/lib/social/search'

export const metadata: Metadata = {
  title: 'Busca',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function BuscaPage({ searchParams }: PageProps) {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/inicio')

  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const users = query ? await searchUsers(query) : []

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar
        isAdmin={user.role === 'ADMIN'}
        hasUploads={user.hasUploads}
        photoUrl={user.photoUrl}
        handle={user.handle}
      />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Busca</h1>

          <form method="GET" className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Buscar por @handle ou nome..."
                autoFocus
                className="flex-1 rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
              />
              <button
                type="submit"
                className="rounded-lg bg-gate-pink px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Buscar
              </button>
            </div>
          </form>

          {query && users.length === 0 && (
            <p className="text-sm text-white/40 text-center py-8">
              Nenhum usuário encontrado para &quot;{query}&quot;.
            </p>
          )}

          {users.length > 0 && (
            <ul className="divide-y divide-gate-azure/40 rounded-lg border border-gate-azure bg-white/5">
              {users.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/perfil/${u.handle}`}
                    className="flex items-center gap-3 p-4 transition hover:bg-white/5"
                  >
                    <Avatar
                      photoUrl={u.photoUrl ?? null}
                      alt={u.displayName}
                      size={40}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{u.displayName}</p>
                      <p className="text-xs text-gate-blue truncate">@{u.handle}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
