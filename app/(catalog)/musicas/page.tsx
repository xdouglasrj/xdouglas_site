import type { Metadata } from 'next'
import { Suspense } from 'react'
import { listTracks, listGenres } from '@/lib/tracks/queries'
import { TrackGrid } from '@/components/music/track-grid'
import { TrackGridSkeleton } from '@/components/music/track-card-skeleton'
import { getCurrentRole } from '@/lib/auth/role'

export const metadata: Metadata = {
  title: 'Músicas',
  description: 'Catálogo de músicas exclusivas para produtores, DJs e artistas.',
}

// Revalida a cada 60 segundos (ISR)
export const revalidate = 60

interface CatalogoContentProps {
  genre?: string
  q?: string
}

async function CatalogoContent({ genre, q }: CatalogoContentProps) {
  const [result, genres, role] = await Promise.all([
    listTracks({ page: 1, perPage: 24, genre, q }),
    listGenres(),
    getCurrentRole(),
  ])

  // Ouvintes (role GUEST) podem ouvir, mas não baixar
  const canDownload = role !== 'GUEST'

  return (
    <TrackGrid
      initialTracks={result.tracks}
      initialTotal={result.total}
      genres={genres}
      initialGenre={genre ?? null}
      initialQuery={q ?? null}
      canDownload={canDownload}
    />
  )
}

interface MusicasPageProps {
  searchParams: Promise<{ genre?: string; q?: string }>
}

export default async function MusicasPage({ searchParams }: MusicasPageProps) {
  const { genre, q } = await searchParams

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Cabeçalho da seção */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Catálogo</h1>
        <p className="mt-1 text-sm text-gate-blue">
          Músicas exclusivas para a comunidade xDouglas
        </p>
      </div>

      {/* Grid com Suspense para loading */}
      <Suspense fallback={<TrackGridSkeleton count={24} />}>
        <CatalogoContent genre={genre} q={q} />
      </Suspense>
    </div>
  )
}
