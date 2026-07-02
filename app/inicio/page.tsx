import type { Metadata } from 'next'
import Link from 'next/link'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { PublicHeader } from '@/components/layout/public-header'
import { Feed } from '@/components/social/feed'
import { TrackCard } from '@/components/music/track-card'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { getCurrentRole } from '@/lib/auth/role'
import { listLatestTracks } from '@/lib/tracks/queries'

export const metadata: Metadata = {
  title: 'Início',
  robots: { index: true, follow: true },
}

const LATEST_TRACKS_LIMIT = 10

export default async function InicioPage() {
  const [user, role, latestTracks] = await Promise.all([
    getCurrentUserBasics(),
    getCurrentRole(),
    listLatestTracks(LATEST_TRACKS_LIMIT),
  ])
  const isLoggedIn = !!user
  const isAdmin = user?.role === 'ADMIN'
  const canDownload = role !== 'GUEST' && role !== null

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gate-bg">
        <IconSidebar isAdmin={isAdmin} hasUploads={user?.hasUploads ?? false} photoUrl={user?.photoUrl} handle={user?.handle} />

        <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-white text-center">Últimos lançamentos</h1>
          <p className="mt-2 max-w-md text-sm text-gate-blue text-center">
            Veja o que a comunidade está postando, ou use o ícone de música na barra lateral
            para explorar por gênero.
          </p>

          {latestTracks.length > 0 && (
            <section className="mt-8 w-full max-w-3xl">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue">
                Músicas mais recentes
              </h2>
              <div className="mt-3 divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
                {latestTracks.map((track) => (
                  <TrackCard key={track.id} track={track} canDownload={canDownload} />
                ))}
              </div>
            </section>
          )}

          <Link
            href="/musicas-recentes"
            className="mt-6 inline-block rounded-lg border border-gate-azure px-5 py-2.5 text-sm font-semibold text-white transition hover:border-gate-pink hover:text-gate-pink"
          >
            Ver todas as músicas
          </Link>

          <Feed />
        </main>
      </div>
    )
  }

  // Visitante anônimo — home pública
  return (
    <div className="min-h-screen bg-gate-bg">
      <PublicHeader />

      <main className="pt-14 md:pt-20 px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-white text-center">Últimos lançamentos</h1>
        <p className="mt-2 max-w-md text-sm text-gate-blue text-center">
          Explore a produção musical da comunidade. Faça login para baixar, curtir e comentar.
        </p>

        {latestTracks.length > 0 && (
          <section className="mt-8 w-full max-w-3xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue">
              Músicas mais recentes
            </h2>
            <div className="mt-3 divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
              {latestTracks.map((track) => (
                <TrackCard key={track.id} track={track} canDownload={false} />
              ))}
            </div>
          </section>
        )}

        <Link
          href="/musicas-recentes"
          className="mt-6 inline-block rounded-lg border border-gate-azure px-5 py-2.5 text-sm font-semibold text-white transition hover:border-gate-pink hover:text-gate-pink"
        >
          Ver todas as músicas
        </Link>
      </main>
    </div>
  )
}
