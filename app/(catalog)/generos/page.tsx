import type { Metadata } from 'next'
import { Suspense } from 'react'
import { listTracks, type TrackSortBy } from '@/lib/tracks/queries'
import { TrackGrid } from '@/components/music/track-grid'
import { TrackGridSkeleton } from '@/components/music/track-card-skeleton'
import { getCurrentRole } from '@/lib/auth/role'

export const metadata: Metadata = {
  title: 'Gêneros',
  description: 'Catálogo completo das músicas da comunidade xDouglas, por gênero.',
}

// Sempre dinâmica — o link de gênero na sidebar precisa refletir o filtro
// escolhido imediatamente, sem cache da versão anterior.
export const dynamic = 'force-dynamic'

const PER_PAGE = 20

interface CatalogoContentProps {
  genre?: string
  q?: string
  sort?: TrackSortBy
}

async function CatalogoContent({ genre, q, sort }: CatalogoContentProps) {
  // Catálogo completo: não aplica o corte de 24/36/48h do feed de
  // /musicas-recentes — aqui é pra navegar todo o histórico por gênero.
  const [result, role] = await Promise.all([
    listTracks({ page: 1, perPage: PER_PAGE, genre, q, sortBy: sort, includeExpired: true }),
    getCurrentRole(),
  ])

  // Visitante anônimo (sem login) e ouvintes (role GUEST) podem ouvir, mas
  // não baixar
  const canDownload = role !== null && role !== 'GUEST'

  return (
    <TrackGrid
      initialTracks={result.tracks}
      initialTotal={result.total}
      initialGenre={genre ?? null}
      initialQuery={q ?? null}
      initialSort={sort}
      canDownload={canDownload}
      mode="catalog"
    />
  )
}

interface GenerosPageProps {
  searchParams: Promise<{ genre?: string; q?: string; sort?: string }>
}

export default async function GenerosPage({ searchParams }: GenerosPageProps) {
  const { genre, q, sort } = await searchParams
  const sortBy = (['recent', 'name', 'artist', 'downloads'] as const).includes(sort as TrackSortBy)
    ? (sort as TrackSortBy)
    : undefined

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Cabeçalho da seção */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">{genre ?? 'Gêneros'}</h1>
        <p className="mt-1 text-sm text-gate-blue">
          Catálogo completo: todas as músicas publicadas, sem limite de tempo
        </p>
      </div>

      {/* key força remount do TrackGrid quando genre/q/sort muda via navegação
          (ex.: clicar em outro gênero na sidebar) — sem isso, o TrackGrid
          (client component) mantém seu estado local antigo. */}
      <Suspense
        key={`${genre ?? 'all'}::${q ?? ''}::${sortBy ?? 'recent'}`}
        fallback={<TrackGridSkeleton count={PER_PAGE} />}
      >
        <CatalogoContent genre={genre} q={q} sort={sortBy} />
      </Suspense>
    </div>
  )
}
