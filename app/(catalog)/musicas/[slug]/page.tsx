import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getTrackBySlug } from '@/lib/tracks/queries'
import { TrackDownloadButton } from './track-download-button'
import { ListenButton } from '@/components/music/listen-button'
import { getCurrentRole } from '@/lib/auth/role'

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

  return {
    title: `${track.title} — ${track.artist.name}`,
    description: track.description ?? `${track.title} por ${track.artist.name}`,
    openGraph: track.coverUrl
      ? { images: [{ url: track.coverUrl, width: 600, height: 600 }] }
      : undefined,
  }
}

// ── Página ────────────────────────────────────────────────────

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [track, role] = await Promise.all([getTrackBySlug(slug), getCurrentRole()])

  if (!track) notFound()

  // Ouvintes (role GUEST) podem ouvir, mas não baixar
  const canDownload = role !== 'GUEST'

  const fileSize = track.audioSizeBytes
    ? formatBytes(Number(track.audioSizeBytes))
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gate-blue" aria-label="Navegação">
        <Link href="/musicas" className="hover:text-white transition-colors">
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
            <h1 className="text-2xl font-bold text-white leading-tight">
              {track.title}
            </h1>
            <p className="mt-1.5 text-gate-blue">
              <Link
                href={`/musicas?artistSlug=${track.artist.slug}`}
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
          </div>

          {/* Metadados técnicos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {track.genre && (
              <MetaField label="Gênero" value={track.genre} />
            )}
            {track.bpm && (
              <MetaField label="BPM" value={String(track.bpm)} />
            )}
            {track.key && (
              <MetaField label="Tom" value={track.key} />
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

          {/* Botões de ouvir / download */}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
            <ListenButton trackId={track.id} title={track.title} />
            {canDownload && <TrackDownloadButton track={track} />}
          </div>
        </div>
      </div>

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
