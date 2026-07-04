import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getSeriesBySlug, listSeriesEpisodes } from '@/lib/tracks/series'
import { getCurrentRole } from '@/lib/auth/role'
import { TrackCard, toPlayerTrack } from '@/components/music/track-card'
import { SeriesPlayAllButton } from '@/components/music/series-play-all-button'

export const revalidate = 120

// ── Metadata dinâmica ─────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const series = await getSeriesBySlug(slug)
  if (!series) return { title: 'Série não encontrada' }

  return {
    title: `${series.title} — ${series.artist.name}`,
    description: series.description ?? `Série ${series.title} por ${series.artist.name}`,
    robots: { index: true, follow: true },
    openGraph: series.coverUrl
      ? { images: [{ url: series.coverUrl, width: 600, height: 600 }] }
      : undefined,
  }
}

// ── Página ────────────────────────────────────────────────────

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [series, role] = await Promise.all([getSeriesBySlug(slug), getCurrentRole()])
  if (!series) notFound()

  const episodes = await listSeriesEpisodes(series.id)
  const canDownload = role !== null && role !== 'GUEST'
  const isLoggedIn = role !== null
  const queue = episodes.map(toPlayerTrack)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: series.title,
    description: series.description ?? undefined,
    numTracks: episodes.length,
    author: { '@type': 'MusicGroup', name: series.artist.name },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cabeçalho da série */}
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-full sm:w-56 shrink-0">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-gate-azure">
            {series.coverUrl ? (
              <Image
                src={series.coverUrl}
                alt={`Capa de ${series.title}`}
                fill
                sizes="(max-width: 640px) 100vw, 224px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-gate-bg flex items-center justify-center">
                <span className="text-5xl font-bold text-white/20 select-none">
                  {series.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-gate-blue">Série</p>
          <h1 className="text-2xl font-bold text-white leading-tight">{series.title}</h1>
          <p className="text-gate-blue">
            por{' '}
            <Link href={`/artista/${series.artist.slug}`} className="hover:text-white transition-colors">
              {series.artist.name}
            </Link>
            {' · '}
            {episodes.length} episódio{episodes.length !== 1 ? 's' : ''}
          </p>
          {series.description && (
            <p className="text-sm text-gate-blue leading-relaxed">{series.description}</p>
          )}
          <div className="mt-1">
            <SeriesPlayAllButton queue={queue} />
          </div>
        </div>
      </div>

      {/* Episódios */}
      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue mb-3">Episódios</h2>
        {episodes.length === 0 ? (
          <p className="text-sm text-gate-blue">Nenhum episódio publicado ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {episodes.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                canDownload={canDownload}
                isLoggedIn={isLoggedIn}
                queue={queue}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
