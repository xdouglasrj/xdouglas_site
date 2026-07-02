import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { PlaylistList } from '@/components/playlists/playlist-list'

export const metadata: Metadata = {
  title: 'Suas playlists',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function PlaylistsPage() {
  const token = await getAccessToken()
  if (!token) redirect('/')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/')

  const playlists = await prisma.playlist.findMany({
    where: { userId: payload.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { tracks: true } },
      tracks: {
        orderBy: { position: 'asc' },
        take: 4,
        select: { track: { select: { coverUrl: true } } },
      },
    },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Suas playlists</h1>
        <p className="mt-1 text-sm text-gate-blue">
          Organize as músicas que você curte em coleções suas.
        </p>
      </div>

      <PlaylistList
        initialPlaylists={playlists.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          isPublic: p.isPublic,
          trackCount: p._count.tracks,
          coverUrls: p.tracks.map((t) => t.track.coverUrl).filter((u): u is string => !!u),
        }))}
      />
    </div>
  )
}
