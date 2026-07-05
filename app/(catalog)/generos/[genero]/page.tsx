import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { listTracks } from '@/lib/tracks/queries'
import { listHighlightedTracks } from '@/lib/tracks/highlighted-queries'
import { genreFromSlug } from '@/lib/tracks/genres'
import { TrackGrid } from '@/components/music/track-grid'
import { TrackCard } from '@/components/music/track-card'
import { toPlayerTrack } from '@/lib/tracks/to-player-track'
import { TrackGridSkeleton } from '@/components/music/track-card-skeleton'
import { getCurrentRole } from '@/lib/auth/role'

// Página pública e indexável por gênero — uma URL própria por gênero
// melhora SEO de long-tail (§3.1/§3.4 do MAPA-E-PLANO-XDOUGLAS.md).
// Acessível sem login.
export const dynamic = 'force-dynamic'

const PER_PAGE = 20

const HIGHLIGHTED_GENRE_LIMIT = 6

interface PageProps {
  params: Promise<{ genero: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genero } = await params
  const genre = genreFromSlug(genero)
  if (!genre) return { title: 'Gênero não encontrado' }

  return {
    title: `Músicas de ${genre}`,
    description: `Catálogo completo de músicas de ${genre} no xDouglas.`,
    robots: { index: true, follow: true },
  }
}

export default async function GeneroPage({ params }: PageProps) {
  const { genero } = await params
  const genre = genreFromSlug(genero)
  if (!genre) notFound()

  const [result, role, highlightedTracks] = await Promise.all([
    listTracks({ page: 1, perPage: PER_PAGE, genre, includeExpired: true }),
    getCurrentRole(),
    listHighlightedTracks(HIGHLIGHTED_GENRE_LIMIT, genre).catch(() => []),
  ])

  // Visitante anônimo (sem login) e ouvintes (role GUEST) podem ouvir, mas
  // não baixar
  const canDownload = role !== null && role !== 'GUEST'
  const isLoggedIn = role !== null
  const highlightQueue = highlightedTracks.map(toPlayerTrack)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">{genre}</h1>
        <p className="mt-1 text-sm text-gate-blue">
          Catálogo completo de {genre}: todas as músicas publicadas, sem limite de tempo
        </p>
      </div>

      {/* V3 Plano 13 — faixas com destaque pago ativo neste gênero */}
      {highlightedTracks.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gate-blue">
            ⭐ Em destaque
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlightedTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                canDownload={canDownload}
                isLoggedIn={isLoggedIn}
                queue={highlightQueue}
                isHighlighted
              />
            ))}
          </div>
        </section>
      )}

      <Suspense fallback={<TrackGridSkeleton count={PER_PAGE} />}>
        <TrackGrid
          initialTracks={result.tracks}
          initialTotal={result.total}
          initialGenre={genre}
          canDownload={canDownload}
          isLoggedIn={role !== null}
          mode="catalog"
        />
      </Suspense>
    </div>
  )
}
