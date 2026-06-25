import type { Metadata } from 'next'
import { Suspense } from 'react'
import { listTracks } from '@/lib/tracks/queries'
import { TrackGrid } from '@/components/music/track-grid'
import { TrackGridSkeleton } from '@/components/music/track-card-skeleton'
import { getCurrentRole } from '@/lib/auth/role'

export const metadata: Metadata = {
  title: 'Músicas recentes',
  description: 'Músicas postadas pela comunidade xDouglas nas últimas 24h.',
}

// Sempre dinâmica — feed em tempo real, cada música tem sua própria
// janela de 24h desde o upload.
export const dynamic = 'force-dynamic'

const PER_PAGE = 20

interface FeedContentProps {
  q?: string
}

async function FeedContent({ q }: FeedContentProps) {
  // Feed: só músicas dentro da janela de exibição (24/36/48h, configurável
  // pelo admin), contada individualmente a partir do publishedAt de cada
  // upload — não é um corte de calendário fixo.
  const [result, role] = await Promise.all([
    listTracks({ page: 1, perPage: PER_PAGE, q }),
    getCurrentRole(),
  ])

  // Ouvintes (role GUEST) podem ouvir, mas não baixar
  const canDownload = role !== 'GUEST'

  return (
    <TrackGrid
      initialTracks={result.tracks}
      initialTotal={result.total}
      genres={[]}
      initialQuery={q ?? null}
      canDownload={canDownload}
      mode="feed"
    />
  )
}

interface MusicasPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function MusicasRecentesPage({ searchParams }: MusicasPageProps) {
  const { q } = await searchParams

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Cabeçalho da seção */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">Músicas recentes</h1>
        <p className="mt-1 text-sm text-gate-blue">
          Só o que foi postado nas últimas 24h — cada música tem sua própria janela a partir do upload
        </p>
      </div>

      <Suspense key={q ?? ''} fallback={<TrackGridSkeleton count={PER_PAGE} />}>
        <FeedContent q={q} />
      </Suspense>
    </div>
  )
}
