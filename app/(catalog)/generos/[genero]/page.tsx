import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { listTracks } from '@/lib/tracks/queries'
import { genreFromSlug } from '@/lib/tracks/genres'
import { TrackGrid } from '@/components/music/track-grid'
import { TrackGridSkeleton } from '@/components/music/track-card-skeleton'
import { getCurrentRole } from '@/lib/auth/role'

// Página pública e indexável por gênero — uma URL própria por gênero
// melhora SEO de long-tail (§3.1/§3.4 do MAPA-E-PLANO-XDOUGLAS.md).
// Acessível sem login.
export const dynamic = 'force-dynamic'

const PER_PAGE = 20

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

  const [result, role] = await Promise.all([
    listTracks({ page: 1, perPage: PER_PAGE, genre, includeExpired: true }),
    getCurrentRole(),
  ])

  // Visitante anônimo (sem login) e ouvintes (role GUEST) podem ouvir, mas
  // não baixar
  const canDownload = role !== null && role !== 'GUEST'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">{genre}</h1>
        <p className="mt-1 text-sm text-gate-blue">
          Catálogo completo de {genre}: todas as músicas publicadas, sem limite de tempo
        </p>
      </div>

      <Suspense fallback={<TrackGridSkeleton count={PER_PAGE} />}>
        <TrackGrid
          initialTracks={result.tracks}
          initialTotal={result.total}
          initialGenre={genre}
          canDownload={canDownload}
          mode="catalog"
        />
      </Suspense>
    </div>
  )
}
