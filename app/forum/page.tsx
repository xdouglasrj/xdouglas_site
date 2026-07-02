import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { listActiveSectors } from '@/lib/forum/forum'
import { AdSlot } from '@/components/ads/ad-slot'

export const metadata: Metadata = { title: 'Fórum', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function ForumPage() {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  const sectors = await listActiveSectors()

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} hasUploads={user.hasUploads} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl lg:max-w-4xl mx-auto flex gap-8 items-start">
          <div className="max-w-2xl flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white mb-6">Fórum</h1>

            {sectors.length === 0 ? (
              <p className="text-center text-sm text-white/40 py-12">Nenhum setor disponível ainda.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {sectors.map((sector) => (
                  <Link
                    key={sector.id}
                    href={`/forum/${sector.slug}`}
                    className="rounded-lg border border-gate-azure bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{sector.name}</p>
                      {sector.onlyAdminPost && (
                        <span className="shrink-0 rounded-full bg-gate-pink/15 px-2 py-0.5 text-[10px] font-medium text-gate-pink">
                          Oficial
                        </span>
                      )}
                    </div>
                    {sector.description && (
                      <p className="mt-1 text-xs text-white/50 line-clamp-2">{sector.description}</p>
                    )}
                    <p className="mt-3 text-[11px] text-gate-blue">
                      {sector._count.threads} tópico{sector._count.threads !== 1 ? 's' : ''}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar de ads — só desktop (md+), nunca aparece em mobile */}
          <aside className="hidden md:block shrink-0 sticky top-24">
            <AdSlot slot="forum-sidebar" />
          </aside>
        </div>
      </main>
    </div>
  )
}
