import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { getSectorBySlug, listThreadsBySector } from '@/lib/forum/forum'
import { Avatar } from '@/components/ui/avatar'
import { AdSlot } from '@/components/ads/ad-slot'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ setor: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { setor } = await params
  const sector = await getSectorBySlug(setor)
  return { title: sector?.name ?? 'Fórum', robots: { index: false, follow: false } }
}

export default async function SetorPage({ params, searchParams }: PageProps) {
  const { setor } = await params
  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  const sector = await getSectorBySlug(setor)
  if (!sector || !sector.active) notFound()

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const { threads, totalPages } = await listThreadsBySector(sector.id, page)

  const canPost = sector.onlyAdminPost ? user.role === 'ADMIN' : true

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} hasUploads={user.hasUploads} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl lg:max-w-4xl mx-auto flex gap-8 items-start">
          <div className="max-w-2xl flex-1 min-w-0">
            <Link href="/forum" className="inline-flex items-center gap-1.5 text-sm text-gate-blue hover:text-gate-pink transition mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Voltar ao fórum
            </Link>

            <div className="flex items-center justify-between mb-1">
              <h1 className="text-xl font-bold text-white">{sector.name}</h1>
              {canPost && (
                <Link
                  href={`/forum/${sector.slug}/novo`}
                  className="rounded-lg bg-gate-pink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Novo tópico
                </Link>
              )}
            </div>
            {sector.description && <p className="text-sm text-white/50 mb-6">{sector.description}</p>}

            {threads.length === 0 ? (
              <p className="text-center text-sm text-white/40 py-12">Nenhum tópico ainda neste setor.</p>
            ) : (
              <ul className="divide-y divide-gate-azure/40 rounded-lg border border-gate-azure bg-white/5">
                {threads.map((thread) => (
                  <li key={thread.id}>
                    <Link href={`/forum/${sector.slug}/${thread.id}`} className="flex items-start gap-3 p-4 transition hover:bg-white/5">
                      <Avatar photoUrl={thread.author.photoUrl} alt={thread.author.name ?? thread.author.handle ?? ''} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {thread.pinned && (
                            <span className="shrink-0 rounded-full bg-gate-pink/15 px-2 py-0.5 text-[10px] font-medium text-gate-pink">
                              Fixado
                            </span>
                          )}
                          {thread.locked && (
                            <span className="shrink-0 rounded-full bg-orange-950/40 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                              Bloqueado
                            </span>
                          )}
                          <p className="text-sm font-medium text-white truncate">{thread.title}</p>
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">
                          {thread.author.artisticName || thread.author.name || `@${thread.author.handle}`}
                          {' · '}
                          {new Date(thread.createdAt).toLocaleDateString('pt-BR')}
                          {' · '}
                          {thread._count.replies} {thread._count.replies === 1 ? 'resposta' : 'respostas'}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/forum/${sector.slug}?page=${p}`}
                    className={`rounded-md px-3 py-1.5 ${p === page ? 'bg-gate-pink text-white' : 'text-white/50 hover:bg-white/5'}`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="hidden md:block shrink-0 sticky top-24">
            <AdSlot slot="forum-sidebar" />
          </aside>
        </div>
      </main>
    </div>
  )
}
