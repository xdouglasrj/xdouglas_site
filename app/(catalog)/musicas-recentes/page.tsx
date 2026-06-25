import type { Metadata } from 'next'
import { Suspense } from 'react'
import { listTracks, listGenres } from '@/lib/tracks/queries'
import { TrackGrid } from '@/components/music/track-grid'
import { TrackGridSkeleton } from '@/components/music/track-card-skeleton'
import { getCurrentRole } from '@/lib/auth/role'

export const metadata: Metadata = {
  title: 'Músicas recentes',
  description: 'Histórico completo das músicas postadas pela comunidade xDouglas.',
}

// Sempre dinâmica — histórico em tempo real. Com ISR (revalidate), o
// Next.js cacheava agressivamente a versão "sem filtro" da rota no
// router cache do navegador, fazendo o link "Músicas recentes" da
// sidebar voltar a mostrar o filtro de gênero anterior em vez do
// histórico completo, até um reload manual.
export const dynamic = 'force-dynamic'

const PER_PAGE = 20

interface CatalogoContentProps {
  genre?: string
  q?: string
}

async function CatalogoContent({ genre, q }: CatalogoContentProps) {
  // Histórico completo: não aplica o corte de 24/36/48h do feed/início,
  // pois com alto volume de uploads (100+/dia) a música não pode "sumir"
  // antes de o DJ/ouvinte conseguir acompanhar.
  const [result, genres, role] = await Promise.all([
    listTracks({ page: 1, perPage: PER_PAGE, genre, q, includeExpired: true }),
    listGenres(true),
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
      includeExpired
    />
  )
}

interface MusicasPageProps {
  searchParams: Promise<{ genre?: string; q?: string }>
}

export default async function MusicasRecentesPage({ searchParams }: MusicasPageProps) {
  const { genre, q } = await searchParams

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Cabeçalho da seção */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">Músicas recentes</h1>
        <p className="mt-1 text-sm text-gate-blue">
          Histórico completo: toda música publicada continua aqui, mesmo depois de sair do início
        </p>
      </div>

      {/* Grid com Suspense para loading.
          key força remount do TrackGrid quando genre/q muda via navegação
          (ex.: clicar em outro gênero na sidebar) — sem isso, o TrackGrid
          (client component) mantém seu estado local antigo e ignora os
          novos dados vindos do servidor. */}
      <Suspense key={`${genre ?? 'all'}::${q ?? ''}`} fallback={<TrackGridSkeleton count={PER_PAGE} />}>
        <CatalogoContent genre={genre} q={q} />
      </Suspense>
    </div>
  )
}
