import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getTrackBySlug } from '@/lib/tracks/queries'
import { getTrackOwner } from '@/lib/social/track-comments'
import { isFollowing } from '@/lib/social/follow'
import { TrackDownloadButton } from './track-download-button'
import { WaveformPlayer } from '@/components/music/waveform-player'
import { TrackLikeButton } from '@/components/music/track-like-button'
import { TrackRepostButton } from '@/components/music/track-repost-button'
import { TrackProgressBar } from '@/components/music/track-progress-bar'
import { ShareButton } from '@/components/music/share-button'
import { AddToPlaylistButton } from '@/components/music/add-to-playlist-button'
import { TrackReactions } from '@/components/music/track-reactions'
import { TrackComments } from '@/components/music/track-comments'
import { TracklistSection } from '@/components/music/tracklist-section'
import { getTrackTracklist } from '@/lib/tracks/tracklist-writer'
import { getSeriesContextForTrack } from '@/lib/tracks/series'
import { getCurrentRole } from '@/lib/auth/role'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { getTrackTrendingBadge } from '@/lib/trending'
import { genreToSlug } from '@/lib/tracks/genres'
import { trackKindLabel } from '@/lib/tracks/track-kinds'

export const revalidate = 120

// ── Metadata dinâmica ─────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const track = await getTrackBySlug(slug)

  if (!track) return { title: 'Música não encontrada' }

  // V3 Plano 8 — twitter:card=player aponta pro /embed/musicas/[slug]: faz o
  // link da música tocar dentro do X/Discord num iframe, em vez de só um
  // card de imagem. playerUrl/streamUrl apontam para a mesma página HTML
  // do embed (nunca para o áudio bruto — a URL assinada de streaming tem
  // TTL curto e não pode virar um link permanente compartilhado).
  const embedUrl = `https://xdouglas.com.br/embed/musicas/${track.slug}`

  return {
    title: `${track.title} — ${track.artist.name}`,
    description: track.description ?? `${track.title} por ${track.artist.name}`,
    robots: { index: true, follow: true },
    openGraph: track.coverUrl
      ? { images: [{ url: track.coverUrl, width: 600, height: 600 }] }
      : undefined,
    twitter: {
      card: 'player',
      players: {
        playerUrl: embedUrl,
        streamUrl: embedUrl,
        width: 400,
        height: 152,
      },
      images: track.coverUrl ? [track.coverUrl] : undefined,
    },
  }
}

// ── Página ────────────────────────────────────────────────────

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [track, role, viewer] = await Promise.all([
    getTrackBySlug(slug),
    getCurrentRole(),
    getCurrentUserBasics(),
  ])

  if (!track) notFound()

  const [trackOwner, trendingBadge, tracklist, seriesContext] = await Promise.all([
    getTrackOwner(track.id),
    getTrackTrendingBadge(track.id, track.genre),
    getTrackTracklist(track.id),
    track.seriesId
      ? getSeriesContextForTrack(track.id, track.seriesId, track.episodeNumber)
      : Promise.resolve(null),
  ])

  const playerTrack = {
    id: track.id,
    slug: track.slug,
    title: track.title,
    artistName: track.artist.name,
    coverUrl: track.coverUrl,
  }
  const isOwnTrack = !!viewer && !!trackOwner?.ownerId && viewer.id === trackOwner.ownerId

  // V3 Plano 12 — para faixas com follow-gate, o botão precisa saber se o
  // viewer já segue o dono (decide "Download" vs "Seguir para baixar").
  // Verificação de acesso REAL continua no servidor (/api/download).
  const alreadyFollowingOwner =
    track.downloadMode === 'follow' && !!viewer && !!trackOwner?.ownerId && !isOwnTrack
      ? await isFollowing(viewer.id, trackOwner.ownerId)
      : false

  // Visitante anônimo (role null, sem login) e ouvintes (role GUEST) podem
  // ouvir, mas não baixar — baixar continua exigindo conta (≥ MEMBER).
  const canDownload = role !== null && role !== 'GUEST'

  const fileSize = track.audioSizeBytes
    ? formatBytes(Number(track.audioSizeBytes))
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: track.title,
    description: track.description ?? `${track.title} por ${track.artist.name}`,
    image: track.coverUrl ?? undefined,
    genre: track.genre ?? undefined,
    datePublished: track.publishedAt ?? undefined,
    byArtist: {
      '@type': 'MusicGroup',
      name: track.artist.name,
    },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gate-blue" aria-label="Navegação">
        <Link href="/musicas-recentes" className="hover:text-white transition-colors">
          Músicas
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white/70 truncate">{track.title}</span>
      </nav>

      <div className="flex flex-col sm:flex-row gap-8">
        {/* Capa */}
        <div className="w-full sm:w-64 shrink-0">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-gate-azure">
            {track.coverUrl ? (
              <Image
                src={track.coverUrl}
                alt={`Capa de ${track.title}`}
                fill
                sizes="(max-width: 640px) 100vw, 256px"
                className="object-cover"
                priority
              />
            ) : (
              <CoverPlaceholder title={track.title} />
            )}
          </div>
        </div>

        {/* Detalhes */}
        <div className="flex flex-col gap-5 flex-1 min-w-0">
          {/* Título e artista */}
          <div>
            {/* Selo de trending (V3 Plano 4) — compartilhável em print */}
            {trendingBadge && (
              <Link
                href="/trending"
                className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-gate-pink/60 bg-gate-pink/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gate-pink transition hover:bg-gate-pink/25"
              >
                📈 #{trendingBadge.position} desta semana
                {trendingBadge.genre ? ` em ${trendingBadge.genre}` : ''}
              </Link>
            )}
            <h1 className="text-2xl font-bold text-white leading-tight">
              {track.title}
            </h1>
            <p className="mt-1.5 text-gate-blue">
              <Link
                href={`/artista/${track.artist.slug}`}
                className="hover:text-white transition-colors"
              >
                {track.artist.name}
              </Link>
              {track.producerName && track.producerName !== track.artist.name && (
                <span className="text-white/40">
                  {' '}· prod. {track.producerName}
                </span>
              )}
            </p>

            {/* Série (V3 Plano 14) — badge do episódio + link para a série */}
            {seriesContext && (
              <Link
                href={`/series/${seriesContext.series.slug}`}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gate-azure bg-white/5 px-3 py-1 text-xs font-medium text-gate-blue transition hover:border-gate-pink hover:text-gate-pink"
              >
                {seriesContext.episodeNumber != null && (
                  <span className="font-bold text-white">Ep. {seriesContext.episodeNumber}</span>
                )}
                <span className="truncate">{seriesContext.series.title}</span>
              </Link>
            )}
          </div>

          {/* Metadados técnicos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {track.kind !== 'track' && (
              <MetaField label="Tipo" value={trackKindLabel(track.kind)} />
            )}
            {track.genre && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-gate-blue font-medium">
                  Gênero
                </span>
                <Link
                  href={`/generos/${genreToSlug(track.genre)}`}
                  className="text-sm text-white/80 font-medium hover:text-gate-pink transition-colors"
                >
                  {track.genre}
                </Link>
              </div>
            )}
            {track.mood && (
              <MetaField label="Mood" value={track.mood} />
            )}
            {track.bpm && (
              <MetaField label="BPM" value={String(track.bpm)} />
            )}
            {track.key && (
              <MetaField label="Tom" value={track.key} />
            )}
            {track.durationSeconds && (
              <MetaField label="Duração" value={formatDuration(track.durationSeconds)} />
            )}
            <MetaField
              label="Formato"
              value={track.audioFormat.toUpperCase()}
            />
            {fileSize && (
              <MetaField label="Tamanho" value={fileSize} />
            )}
            <MetaField
              label="Downloads"
              value={track.downloadCount.toLocaleString('pt-BR')}
            />
            {track.publishedAt && (
              <MetaField
                label="Aprovada em"
                value={new Date(track.publishedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
              />
            )}
          </div>

          {/* Descrição */}
          {track.description && (
            <p className="text-sm text-gate-blue leading-relaxed">
              {track.description}
            </p>
          )}

          {/* Tags clicáveis (V3 Plano 5) — levam à busca por tag */}
          {track.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {track.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/busca?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-gate-azure px-2.5 py-1 text-xs text-gate-blue transition hover:border-gate-pink hover:text-gate-pink"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Player + ações */}
          <div className="mt-auto flex flex-col gap-3 pt-2">
            <WaveformPlayer
              trackId={track.id}
              slug={track.slug}
              title={track.title}
              artistName={track.artist.name}
              coverUrl={track.coverUrl}
              showCover={false}
            />
            {/* Barrinha "já ouvido" (V3 Plano 11) */}
            <TrackProgressBar
              trackId={track.id}
              durationSeconds={track.durationSeconds}
              isLoggedIn={role !== null}
            />
            <div className="flex flex-wrap items-center gap-3">
              {canDownload && (
                <TrackDownloadButton track={track} alreadyFollowing={alreadyFollowingOwner || isOwnTrack} />
              )}
              <TrackLikeButton trackId={track.id} initialCount={track.likeCount} isLoggedIn={role !== null} />
              <TrackRepostButton
                trackId={track.id}
                initialCount={track.repostCount}
                isLoggedIn={role !== null}
                isOwnTrack={isOwnTrack}
              />
              <ShareButton trackId={track.id} slug={track.slug} title={track.title} artistName={track.artist.name} />
              {role !== null && <AddToPlaylistButton trackId={track.id} />}
            </div>
            {/* Reações com emoji (V3 Plano 15) — camada expressiva adicional ao like */}
            <TrackReactions trackId={track.id} isLoggedIn={role !== null} />
          </div>
        </div>
      </div>

      {/* Mais desta série (V3 Plano 14) — vizinhos + navegação anterior/próximo */}
      {seriesContext && seriesContext.neighbors.length > 0 && (
        <section className="mt-10 pt-8 border-t border-gate-azure">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gate-blue uppercase tracking-wide">
              Mais desta série
            </h2>
            <Link
              href={`/series/${seriesContext.series.slug}`}
              className="text-xs font-semibold text-gate-pink transition hover:opacity-80"
            >
              Ver a série →
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
            {seriesContext.neighbors.map((ep) => (
              <Link
                key={ep.slug}
                href={`/musicas/${ep.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/5"
              >
                {ep.episodeNumber != null && (
                  <span className="w-12 shrink-0 text-xs font-bold tabular-nums text-gate-blue">
                    Ep. {ep.episodeNumber}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-white/80">{ep.title}</span>
              </Link>
            ))}
          </div>

          {(seriesContext.prevSlug || seriesContext.nextSlug) && (
            <div className="mt-3 flex items-center justify-between gap-3">
              {seriesContext.prevSlug ? (
                <Link
                  href={`/musicas/${seriesContext.prevSlug}`}
                  className="text-xs font-medium text-gate-blue transition hover:text-gate-pink"
                >
                  ← Episódio anterior
                </Link>
              ) : (
                <span />
              )}
              {seriesContext.nextSlug ? (
                <Link
                  href={`/musicas/${seriesContext.nextSlug}`}
                  className="text-xs font-medium text-gate-blue transition hover:text-gate-pink"
                >
                  Próximo episódio →
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </section>
      )}

      {/* Tracklist com timestamps (V3 Plano 10) — clicar faz seek no player */}
      {tracklist.length > 0 && (
        <>
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: `Tracklist — ${track.title}`,
                numberOfItems: tracklist.length,
                itemListElement: tracklist.map((item) => ({
                  '@type': 'ListItem',
                  position: item.position,
                  name: item.title,
                })),
              }),
            }}
          />
          <TracklistSection items={tracklist} playerTrack={playerTrack} />
        </>
      )}

      {/* Bio do artista */}
      {track.artist.bio && (
        <section className="mt-10 pt-8 border-t border-gate-azure">
          <h2 className="text-sm font-semibold text-gate-blue uppercase tracking-wide mb-3">
            Sobre o artista
          </h2>
          <div className="flex gap-4 items-start">
            {track.artist.photoUrl && (
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/5 shrink-0">
                <Image
                  src={track.artist.photoUrl}
                  alt={track.artist.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="font-medium text-white text-sm">{track.artist.name}</p>
              <p className="mt-1 text-sm text-gate-blue leading-relaxed">
                {track.artist.bio}
              </p>
            </div>
          </div>
        </section>
      )}

      <TrackComments
        trackId={track.id}
        trackOwnerId={trackOwner?.ownerId ?? null}
        isLoggedIn={role !== null}
        playerTrack={playerTrack}
        artistInfo={{ name: track.artist.name, photoUrl: track.artist.photoUrl }}
      />
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-gate-blue font-medium">
        {label}
      </span>
      <span className="text-sm text-white/80 font-medium">{value}</span>
    </div>
  )
}

function CoverPlaceholder({ title }: { title: string }) {
  const colors = [
    'from-rose-900 to-gate-bg',
    'from-violet-900 to-gate-bg',
    'from-amber-900 to-gate-bg',
    'from-teal-900 to-gate-bg',
    'from-sky-900 to-gate-bg',
  ]
  const idx = title.charCodeAt(0) % colors.length
  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br ${colors[idx]} flex items-center justify-center`}
      aria-hidden="true"
    >
      <span className="text-6xl font-bold text-white/20 select-none">
        {title.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}
