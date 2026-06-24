import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { ProfileForm } from '@/components/profile/profile-form'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'

export const metadata: Metadata = {
  title: 'Perfil',
  robots: { index: false, follow: false },
}

const ROLE_LABEL: Record<string, string> = {
  GUEST: 'Ouvinte',
  MEMBER: 'Membro',
  ARTIST: 'Artista',
  ARTIST_SUPPORTER: 'Artista parceiro',
  ADMIN: 'Administrador',
}

export default async function PerfilPage() {
  const token = await getAccessToken()
  if (!token) redirect('/')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      email: true,
      username: true,
      name: true,
      artisticName: true,
      phone: true,
      role: true,
      photoUrl: true,
      createdAt: true,
      artist: { select: { name: true, slug: true } },
    },
  })

  if (!user) redirect('/')

  const isAdmin = user.role === 'ADMIN'
  const isArtist = user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={isAdmin} isArtist={isArtist} photoUrl={user.photoUrl} />

      <main className="md:ml-16 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-lg mx-auto">
          <Breadcrumbs />
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
          <p className="mt-1 text-sm text-gate-blue">
            {ROLE_LABEL[user.role] ?? user.role}
            {user.artist && <span className="text-white/40"> · {user.artist.name}</span>}
          </p>

          <ProfileForm
            email={user.email}
            username={user.username}
            artisticName={user.artisticName}
            phone={user.phone}
            initialName={user.name ?? ''}
            initialPhotoUrl={user.photoUrl}
          />
        </div>
      </main>
    </div>
  )
}
