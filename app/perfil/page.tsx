import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { ProfileFormFields } from '@/components/profile/profile-form'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'

export const metadata: Metadata = {
  title: 'Configurações de perfil',
  robots: { index: false, follow: false },
}

export default async function PerfilConfiguracoesPage() {
  const token = await getAccessToken()
  if (!token) redirect('/')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      email: true,
      username: true,
      artisticName: true,
      phone: true,
      role: true,
      photoUrl: true,
      showEmail: true,
      showPhone: true,
      showName: true,
      name: true,
    },
  })

  if (!user) redirect('/')

  const isAdmin = user.role === 'ADMIN'
  const isArtist = user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={isAdmin} isArtist={isArtist} photoUrl={user.photoUrl} username={user.username} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-md mx-auto">
          {user.username && (
            <Link
              href={`/perfil/${user.username}`}
              className="inline-flex items-center gap-1.5 text-sm text-gate-blue transition hover:text-gate-pink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Ver meu perfil
            </Link>
          )}

          <h1 className="mt-2 text-lg font-bold text-white">Configurações de perfil</h1>

          <div className="mt-4">
            <ProfileFormFields
              email={user.email}
              username={user.username}
              artisticName={user.artisticName}
              phone={user.phone}
              initialName={user.name ?? ''}
              initialPhotoUrl={user.photoUrl}
              initialShowEmail={user.showEmail}
              initialShowPhone={user.showPhone}
              initialShowName={user.showName}
              isArtist={isArtist}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
