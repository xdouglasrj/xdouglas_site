import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TrackForm } from '@/components/admin/track-form'

export const metadata: Metadata = { title: 'Editar música' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarMusicaPage({ params }: PageProps) {
  const { id } = await params

  const track = await prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      genre: true,
      bpm: true,
      key: true,
      producerName: true,
      audioKey: true,
      audioFormat: true,
      audioSizeBytes: true,
      coverKey: true,
      coverUrl: true,
      published: true,
      artistId: true,
    },
  })

  if (!track) notFound()

  const initialValues = {
    title: track.title,
    artistId: track.artistId,
    producerName: track.producerName ?? '',
    description: track.description ?? '',
    genre: track.genre ?? '',
    bpm: track.bpm?.toString() ?? '',
    key: track.key ?? '',
    audioKey: track.audioKey,
    audioFormat: track.audioFormat,
    audioSizeBytes: track.audioSizeBytes?.toString() ?? '',
    coverKey: track.coverKey ?? '',
    coverUrl: track.coverUrl ?? '',
    published: track.published,
  }

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500" aria-label="Navegação">
        <Link href="/admin/musicas" className="hover:text-neutral-300 transition-colors">
          Músicas
        </Link>
        <span>/</span>
        <span className="text-neutral-400 truncate">{track.title}</span>
        <span>/</span>
        <span className="text-neutral-400">Editar</span>
      </nav>

      <h1 className="text-xl font-semibold text-white mb-8">
        Editar: <span className="text-neutral-400 font-normal">{track.title}</span>
      </h1>

      <TrackForm
        mode="edit"
        trackId={track.id}
        initialValues={initialValues}
      />
    </div>
  )
}
