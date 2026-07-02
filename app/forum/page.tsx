import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { listActiveSectors } from '@/lib/forum/forum'

export const metadata: Metadata = {
  title: 'Fórum',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function ForumPage() {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/inicio')

  const sectors = await listActiveSectors()

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
          <h1 className="text-2xl font-bold text-white mb-6">Fórum</h1>

          {sectors.length === 0 ? (
            <p className="text-sm text-white/40 py-12 text-center">
              Nenhum setor disponível no momento.
            </p>
          ) : (
            <ul className="divide-y divide-gate-azure/40 rounded-lg border border-gate-azure bg-white/5">
              {sectors.map((sector) => (
                <li key={sector.id}>
                  <Link
                    href={`/forum/${sector.slug}`}
                    className="flex items-center justify-between gap-4 p-4 transition hover:bg-white/5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{sector.name}</p>
                      {sector.description && (
                        <p className="text-xs text-white/40 mt-0.5">{sector.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-gate-blue">
                      {sector._count.threads}{' '}
                      {sector._count.threads === 1 ? 'tópico' : 'tópicos'}
                    </span>
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
