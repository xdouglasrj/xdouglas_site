import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Avatar } from '@/components/ui/avatar'
import { FollowButton } from '@/components/profile/follow-button'
import { ProfileTracks } from '@/components/profile/profile-tracks'
import { getFollowCounts, isFollowing } from '@/lib/social/follow'
import { getArtistLikeCount } from '@/lib/social/track-likes'
import { listPublishedTracksByArtist } from '@/lib/tracks/artist-queries'
import { getCurrentUserBasics } from '@/lib/auth/current-user'

// Perfil público de artista — canônico e indexável (§3.1/§3.4). Acessível
// sem login: é a porta de entrada pública da plataforma. Hoje os artistas
// também aparecem misturados em /perfil/[usuario] (fechado, noindex); esta
// rota é a versão pública dedicada.
export const revalidate = 120

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getArtist(slug: string) {
  return prisma.artist.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      photoUrl: true,
      active: true,
      updatedAt: true,
      userId: true,
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const artist = await getArtist(slug)

  if (!artist || !artist.active) return { title: 'Artista não encontrado' }

  const description = artist.bio ?? `Ouça as músicas de ${artist.name} no xDouglas.`

  return {
    title: artist.name,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title: artist.name,
      description,
      images: [{ url: artist.photoUrl ?? '/brand/xdouglas-logo.png', width: 600, height: 600 }],
    },
  }
}

export default async function ArtistaPublicoPage({ params }: PageProps) {
  const { slug } = await params

  const artist = await getArtist(slug)
  if (!artist || !artist.active) notFound()

  const viewer = await getCurrentUserBasics()

  const [tracks, likeCount, counts, followingAlready] = await Promise.all([
    listPublishedTracksByArtist(artist.id),
    getArtistLikeCount(artist.id),
    artist.userId ? getFollowCounts(artist.userId) : Promise.resolve({ followers: 0, following: 0 }),
    artist.userId && viewer ? isFollowing(viewer.id, artist.userId) : Promise.resolve(false),
  ])

  const canFollow = !!artist.userId && !!viewer && viewer.id !== artist.userId

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar photoUrl={artist.photoUrl} alt={artist.name} size={64} />
          <div>
            <h1 className="text-xl font-bold text-white">{artist.name}</h1>
            <p className="text-sm text-gate-blue">Artista</p>
          </div>
        </div>

        {canFollow && artist.userId && (
          <FollowButton userId={artist.userId} initialFollowing={followingAlready} />
        )}
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm">
        {artist.userId && (
          <>
            <span className="text-white/80">
              <strong className="text-white">{counts.followers}</strong> seguidores
            </span>
            <span className="text-white/80">
              <strong className="text-white">{counts.following}</strong> seguindo
            </span>
          </>
        )}
        <span className="flex items-center gap-1.5 text-white/80">
          <svg className="w-3.5 h-3.5 text-gate-pink" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 13.5s-5.5-3.36-7-6.6C-0.1 4.2 1.3 2 3.8 2c1.4 0 2.7.8 3.3 2 0.6-1.2 1.9-2 3.3-2 2.5 0 3.9 2.2 2.8 4.9-1.5 3.24-7 6.6-7 6.6z" />
          </svg>
          <strong className="text-white">{likeCount}</strong> curtidas
        </span>
      </div>

      {artist.bio && <p className="mt-4 text-sm text-white/70">{artist.bio}</p>}

      <ProfileTracks tracks={tracks} artistName={artist.name} />
    </div>
  )
}
