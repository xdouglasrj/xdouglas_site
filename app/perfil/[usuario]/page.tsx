import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { FollowButton } from '@/components/profile/follow-button'
import { FollowListModal } from '@/components/profile/follow-list-modal'
import { Avatar } from '@/components/ui/avatar'
import { EditProfileButton } from '@/components/profile/edit-profile-button'
import { ProfileTracks } from '@/components/profile/profile-tracks'
import { getFollowCounts, isFollowing } from '@/lib/social/follow'
import { getArtistLikeCount } from '@/lib/social/track-likes'
import { listPublishedTracksByArtist } from '@/lib/tracks/artist-queries'
import { getLevelName } from '@/lib/points/levels'
import { getPlanQuotaBytes } from '@/lib/settings/plan-quotas'

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')
}

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
    select: { id: true, role: true, photoUrl: true, handle: true, mappingEnabled: true },
  })
  if (!viewer) redirect('/')

  const isSelf = viewer.handle === usuario

  const profile = await prisma.user.findUnique({
    where: { handle: usuario },
    select: {
      id: true,
      username: true,
      handle: true,
      name: true,
      artisticName: true,
      email: true,
      phone: true,
      photoUrl: true,
      role: true,
      showEmail: true,
      showPhone: true,
      showName: true,
      showMusicasNoPerfil: true,
      showEspacoUploadNoPerfil: true,
      showContatosNoPerfil: true,
      createdAt: true,
      totalXp: true,
      level: true,
      plan: true,
      bonusStorageMb: true,
      artist: { select: { id: true, name: true, slug: true, bio: true } },
    },
  })

  if (!profile) notFound()

  const isAdmin = viewer.role === 'ADMIN'
  const isModerator = viewer.role === 'MODERATOR'
  // Regra dura: admin/moderador sempre veem tudo, ignorando os toggles de
  // privacidade do dono do perfil.
  const isPrivileged = isAdmin || isModerator
  const isProfileArtist = profile.role === 'ARTIST' || profile.role === 'ARTIST_SUPPORTER'
  // Espaço de upload nunca é público — só o próprio dono, admin/moderador
  // veem, e só se o dono não tiver escondido (showEspacoUploadNoPerfil).
  const canSeeStorage = isSelf || isPrivileged || profile.showEspacoUploadNoPerfil
  const canSeeTracks = isSelf || isPrivileged || profile.showMusicasNoPerfil

  const [counts, followingAlready, tracks, likeCount, storageUsed, viewerUploadCount] = await Promise.all([
    getFollowCounts(profile.id),
    isSelf ? Promise.resolve(false) : isFollowing(viewer.id, profile.id),
    profile.artist && canSeeTracks ? listPublishedTracksByArtist(profile.artist.id) : Promise.resolve([]),
    profile.artist ? getArtistLikeCount(profile.artist.id) : Promise.resolve(0),
    canSeeStorage
      ? prisma.track.aggregate({ where: { submittedById: profile.id }, _sum: { audioSizeBytes: true } })
      : Promise.resolve(null),
    prisma.track.count({ where: { submittedById: viewer.id } }),
  ])

  const storageUsedBytes = Number(storageUsed?._sum.audioSizeBytes ?? 0)
  const storageQuotaBytes = getPlanQuotaBytes(profile.plan, profile.bonusStorageMb)

  // O perfil mostra só o que foi configurado em "Editar perfil" — vale
  // até para o próprio dono vendo a própria página. Admin/moderador são a
  // única exceção e sempre veem tudo. Ouvintes sempre exibem o nome;
  // artistas decidem se mostram o nome real (showName). showContatosNoPerfil
  // é o interruptor único que agrupa e-mail + telefone.
  const canSeeEmail = isPrivileged || profile.showContatosNoPerfil
  const canSeePhone = isPrivileged || (profile.showContatosNoPerfil && !!profile.phone)
  const canSeeName = isPrivileged || !isProfileArtist || profile.showName
  // XP nunca é público — só o próprio dono e admin/moderador veem o número.
  // Nível (o "título" derivado do XP) pode ficar visível pra todo mundo.
  const canSeeXp = isSelf || isPrivileged
  const displayName = canSeeName
    ? profile.name || profile.artisticName || profile.handle
    : profile.artisticName || profile.handle

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={isAdmin} hasUploads={viewerUploadCount > 0} photoUrl={viewer.photoUrl} handle={viewer.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar photoUrl={profile.photoUrl} alt={profile.name ?? profile.handle ?? ''} size={64} />
              <div>
                <h1 className="text-xl font-bold text-white">{displayName}</h1>
                <p className="text-sm text-gate-blue">@{profile.handle}</p>
              </div>
            </div>

            {isSelf ? (
              <EditProfileButton />
            ) : (
              <FollowButton userId={profile.id} initialFollowing={followingAlready} />
            )}
          </div>

          <p className="mt-2 text-xs text-gate-blue">
            {ROLE_LABEL[profile.role] ?? profile.role}
            {profile.artist && <span className="text-white/40"> · {profile.artist.name}</span>}
          </p>

          <div className="mt-4 flex items-center gap-6 text-sm">
            {isSelf ? (
              <>
                <Link href="/perfil/seguidores" className="text-white/80 transition hover:text-gate-pink">
                  <strong className="text-white">{counts.followers}</strong> seguidores
                </Link>
                <Link href="/perfil/seguindo" className="text-white/80 transition hover:text-gate-pink">
                  <strong className="text-white">{counts.following}</strong> seguindo
                </Link>
              </>
            ) : (
              <>
                <FollowListModal userId={profile.id} type="followers" count={counts.followers} label="seguidores" />
                <FollowListModal userId={profile.id} type="following" count={counts.following} label="seguindo" />
              </>
            )}
            <span className="flex items-center gap-1.5 text-white/80">
              <svg className="w-3.5 h-3.5 text-gate-blue" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.8L8 12.1 3.7 14.4l.8-4.8L1 6.2l4.8-.7z" />
              </svg>
              {getLevelName(profile.level)}
            </span>
            {canSeeXp && (
              <span className="text-white/40 text-xs" title="Visível só para você">
                {profile.totalXp.toLocaleString('pt-BR')} XP
              </span>
            )}
            {profile.artist && (
              <span className="flex items-center gap-1.5 text-white/80">
                <svg className="w-3.5 h-3.5 text-gate-pink" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 13.5s-5.5-3.36-7-6.6C-0.1 4.2 1.3 2 3.8 2c1.4 0 2.7.8 3.3 2 0.6-1.2 1.9-2 3.3-2 2.5 0 3.9 2.2 2.8 4.9-1.5 3.24-7 6.6-7 6.6z" />
                </svg>
                <strong className="text-white">{likeCount}</strong> curtidas
              </span>
            )}
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
                <p className="text-xs text-white/30">E-mail não disponibilizado.</p>
              )}
              {canSeePhone && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gate-blue">WhatsApp</dt>
                  <dd className="text-white/80 truncate">{profile.phone}</dd>
                </div>
              )}
            </dl>
          </section>

          {canSeeStorage && (
            <section className="mt-6 rounded-lg border border-gate-azure bg-white/5 p-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gate-blue" title="Visível conforme sua configuração de privacidade">
                Espaço de upload
              </h2>
              <div className="mt-3">
                <div className="h-1.5 w-full rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full bg-gate-pink"
                    style={{
                      width: `${storageQuotaBytes > 0 ? Math.min(100, (storageUsedBytes / storageQuotaBytes) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-white/70">
                  {formatMb(storageUsedBytes)}MB de {formatMb(storageQuotaBytes)}MB usados
                </p>
              </div>
            </section>
          )}

          {canSeeTracks && <ProfileTracks tracks={tracks} artistName={profile.artist?.name ?? ''} />}
        </div>
      </main>
    </div>
  )
}
