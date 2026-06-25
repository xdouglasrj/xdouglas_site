import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { FollowButton } from '@/components/profile/follow-button'
import { EditProfileButton } from '@/components/profile/edit-profile-button'
import { ProfileTracks } from '@/components/profile/profile-tracks'
import { getFollowCounts, isFollowing } from '@/lib/social/follow'
import { listPublishedTracksByArtist } from '@/lib/tracks/artist-queries'

const ROLE_LABEL: Record<string, string> = {
  GUEST: 'Ouvinte',
  MEMBER: 'Membro',
  ARTIST: 'Artista',
  ARTIST_SUPPORTER: 'Artista parceiro',
  ADMIN: 'Administrador',
}

interface PageProps {
  params: Promise<{ usuario: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { usuario } = await params
  return { title: `@${usuario}`, robots: { index: false, follow: false } }
}

export default async function PerfilPublicoPage({ params }: PageProps) {
  const { usuario } = await params

  const token = await getAccessToken()
  if (!token) redirect('/')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/')

  const viewer = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, photoUrl: true, username: true },
  })
  if (!viewer) redirect('/')

  const isSelf = viewer.username === usuario

  const profile = await prisma.user.findUnique({
    where: { username: usuario },
    select: {
      id: true,
      username: true,
      name: true,
      artisticName: true,
      email: true,
      phone: true,
      photoUrl: true,
      role: true,
      showEmail: true,
      showPhone: true,
      showName: true,
      createdAt: true,
      artist: { select: { id: true, name: true, slug: true, bio: true } },
    },
  })

  if (!profile) notFound()

  const isAdmin = viewer.role === 'ADMIN'
  const isViewerArtist = viewer.role === 'ARTIST' || viewer.role === 'ARTIST_SUPPORTER'
  const isProfileArtist = profile.role === 'ARTIST' || profile.role === 'ARTIST_SUPPORTER'

  const [counts, followingAlready, tracks] = await Promise.all([
    getFollowCounts(profile.id),
    isSelf ? Promise.resolve(false) : isFollowing(viewer.id, profile.id),
    profile.artist ? listPublishedTracksByArtist(profile.artist.id) : Promise.resolve([]),
  ])

  // O próprio usuário e o admin sempre veem tudo. Para os demais, respeita a
  // privacidade escolhida pelo usuário. Ouvintes sempre exibem o nome;
  // artistas decidem se mostram o nome real (showName).
  const canSeeEmail = isSelf || isAdmin || profile.showEmail
  const canSeePhone = isSelf || isAdmin || (profile.showPhone && !!profile.phone)
  const canSeeName = isSelf || isAdmin || !isProfileArtist || profile.showName
  const displayName = canSeeName
    ? profile.name || profile.artisticName || profile.username
    : profile.artisticName || profile.username

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={isAdmin} isArtist={isViewerArtist} photoUrl={viewer.photoUrl} username={viewer.username} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden bg-white/10 border border-gate-azure flex items-center justify-center">
                {profile.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoUrl} alt={profile.name ?? profile.username ?? ''} className="w-full h-full object-cover" />
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gate-blue">
                    <circle cx="12" cy="8" r="4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{displayName}</h1>
                <p className="text-sm text-gate-blue">@{profile.username}</p>
              </div>
            </div>

            {isSelf ? (
              <EditProfileButton
                email={profile.email}
                username={profile.username}
                artisticName={profile.artisticName}
                phone={profile.phone}
                initialName={profile.name ?? ''}
                initialPhotoUrl={profile.photoUrl}
                initialShowEmail={profile.showEmail}
                initialShowPhone={profile.showPhone}
                initialShowName={profile.showName}
                isArtist={isProfileArtist}
              />
            ) : (
              <FollowButton userId={profile.id} initialFollowing={followingAlready} />
            )}
          </div>

          <p className="mt-2 text-xs text-gate-blue">
            {ROLE_LABEL[profile.role] ?? profile.role}
            {profile.artist && <span className="text-white/40"> · {profile.artist.name}</span>}
          </p>

          <div className="mt-4 flex gap-6 text-sm">
            <span className="text-white/80"><strong className="text-white">{counts.followers}</strong> seguidores</span>
            <span className="text-white/80"><strong className="text-white">{counts.following}</strong> seguindo</span>
          </div>

          {profile.artist?.bio && (
            <p className="mt-4 text-sm text-white/70">{profile.artist.bio}</p>
          )}

          {/* Dados de contato — respeita a privacidade escolhida pelo usuário */}
          <section className="mt-6 rounded-lg border border-gate-azure bg-white/5 p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gate-blue">Contato</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {canSeeEmail ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-gate-blue">E-mail</dt>
                  <dd className="text-white/80 truncate">{profile.email}</dd>
                </div>
              ) : (
                <p className="text-xs text-white/30">Este membro optou por não exibir o e-mail.</p>
              )}
              {canSeePhone && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gate-blue">WhatsApp</dt>
                  <dd className="text-white/80 truncate">{profile.phone}</dd>
                </div>
              )}
            </dl>
            {isSelf && (
              <p className="mt-3 text-xs text-white/30">
                Você está vendo seu perfil como ele é salvo. Use &quot;Editar perfil&quot; para
                controlar o que outros membros podem ver.
              </p>
            )}
          </section>

          <ProfileTracks tracks={tracks} />
        </div>
      </main>
    </div>
  )
}
