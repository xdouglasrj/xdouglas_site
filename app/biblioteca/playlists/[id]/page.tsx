import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { PlaylistTrackList } from '@/components/playlists/playlist-track-list'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function PlaylistDetailPage({ params }: PageProps) {
  const { id } = await params

  const token = await getAccessToken()
  if (!token) redirect('/')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/')

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      tracks: {
        orderBy: { position: 'asc' },
        include: {
          track: {
            select: {
              id: true, slug: true, title: true, coverUrl: true,
              artist: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  if (!playlist || playlist.userId !== payload.userId) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{playlist.name}</h1>
        {playlist.description && <p className="mt-1 text-sm text-gate-blue">{playlist.description}</p>}
        <p className="mt-1 text-xs text-gate-blue">
          {playlist.tracks.length} {playlist.tracks.length === 1 ? 'música' : 'músicas'}
        </p>
      </div>

      <PlaylistTrackList
        playlistId={playlist.id}
        initialTracks={playlist.tracks.map((pt) => ({
          id: pt.track.id,
          slug: pt.track.slug,
          title: pt.track.title,
          coverUrl: pt.track.coverUrl,
          artistName: pt.track.artist.name,
        }))}
      />
    </div>
  )
}
