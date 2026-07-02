import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { prisma } from '@/lib/prisma'
import { ProfileFormFields } from '@/components/profile/profile-form'

export const metadata: Metadata = {
  title: 'Editar perfil',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function EditarPerfilPage() {
  const token = await getAccessToken()
  if (!token) redirect('/inicio')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/inicio')

  const viewer = await getCurrentUserBasics()
  if (!viewer) redirect('/inicio')

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      email: true,
      username: true,
      handle: true,
      name: true,
      artisticName: true,
      phone: true,
      photoUrl: true,
      role: true,
      showContatosNoPerfil: true,
      showName: true,
      showMusicasNoPerfil: true,
      showEspacoUploadNoPerfil: true,
      allowComentariosNaMusica: true,
      showComentariosVisiveis: true,
    },
  })

  if (!user) redirect('/inicio')

  const isArtist = user.role === 'ARTIST'

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar
        isAdmin={viewer.role === 'ADMIN'}
        hasUploads={viewer.hasUploads}
        photoUrl={viewer.photoUrl}
        handle={viewer.handle}
      />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Editar perfil</h1>

          <ProfileFormFields
            email={user.email}
            username={user.username}
            handle={user.handle}
            artisticName={user.artisticName}
            phone={user.phone}
            initialName={user.name ?? ''}
            initialPhotoUrl={user.photoUrl}
            initialShowContatosNoPerfil={user.showContatosNoPerfil}
            initialShowName={user.showName}
            initialShowMusicasNoPerfil={user.showMusicasNoPerfil}
            initialShowEspacoUploadNoPerfil={user.showEspacoUploadNoPerfil}
            initialAllowComentariosNaMusica={user.allowComentariosNaMusica}
            initialShowComentariosVisiveis={user.showComentariosVisiveis}
            isArtist={isArtist}
          />
        </div>
      </main>
    </div>
  )
}
