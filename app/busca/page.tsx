import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { searchUsers } from '@/lib/social/search'
import { listTracks } from '@/lib/tracks/queries'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { getCurrentRole } from '@/lib/auth/role'
import { isFollowing } from '@/lib/social/follow'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { TrackGrid } from '@/components/music/track-grid'
import { FollowButton } from '@/components/profile/follow-button'
import { Avatar } from '@/components/ui/avatar'

export const metadata: Metadata = {
  title: 'Buscar',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const PER_PAGE = 20

interface BuscaPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function BuscaPage({ searchParams }: BuscaPageProps) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  if (!query) redirect('/inicio')

  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  const isAdmin = user.role === 'ADMIN'
  const isArtist = user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'

  const [role, people, trackResult] = await Promise.all([
    getCurrentRole(),
    searchUsers(query),
    listTracks({ page: 1, perPage: PER_PAGE, q: query, includeExpired: true }),
  ])

  const canDownload = role !== 'GUEST'

  const followingStates = await Promise.all(
    people.map((p) => (p.id === user.id ? Promise.resolve(false) : isFollowing(user.id, p.id)))
  )

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={isAdmin} isArtist={isArtist} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-white text-center">
            Resultados para &quot;{query}&quot;
          </h1>

          {/* Pessoas — artistas e ouvintes encontrados pelo @ ou nome */}
          <section className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue">
              Pessoas {people.length > 0 && `(${people.length})`}
            </h2>

            {people.length === 0 ? (
              <p className="mt-3 text-sm text-white/40">Nenhum usuário encontrado.</p>
            ) : (
              <div className="mt-3 divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
                {people.map((person, i) => (
                  <div key={person.id} className="flex items-center gap-4 px-4 py-3">
                    <Link href={`/perfil/${person.handle}`} className="flex flex-1 items-center gap-4 min-w-0">
                      <Avatar photoUrl={person.photoUrl} alt={person.displayName} size={44} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{person.displayName}</p>
                        <p className="text-xs text-gate-blue truncate">@{person.handle}</p>
                      </div>
                    </Link>

                    {person.id !== user.id && (
                      <FollowButton userId={person.id} initialFollowing={followingStates[i]} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Músicas */}
          <section className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue">Músicas</h2>
            <div className="mt-3">
              <TrackGrid
                initialTracks={trackResult.tracks}
                initialTotal={trackResult.total}
                initialQuery={query}
                canDownload={canDownload}
                mode="catalog"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
