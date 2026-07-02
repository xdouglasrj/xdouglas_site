import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { ProfileFormFields } from '@/components/profile/profile-form'

export const metadata: Metadata = { title: 'Editar perfil', robots: { index: false, follow: false } }

export default async function EditarPerfilPage() {
  const token = await getAccessToken()
  if (!token) redirect('/')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      username: true,
      handle: true,
      name: true,
      artisticName: true,
      phone: true,
      photoUrl: true,
      role: true,
      mappingEnabled: true,
      showContatosNoPerfil: true,
      showName: true,
      showMusicasNoPerfil: true,
      showEspacoUploadNoPerfil: true,
      allowComentariosNaMusica: true,
      showComentariosVisiveis: true,
    },
  })
  if (!user) redirect('/')

  const isAdmin = user.role === 'ADMIN'
  const isArtist = user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'
  const uploadCount = await prisma.track.count({ where: { submittedById: user.id } })

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={isAdmin} hasUploads={uploadCount > 0} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-white">Editar perfil</h1>
            <Link
              href={user.handle ? `/perfil/${user.handle}` : '/perfil'}
              className="text-sm text-gate-blue transition hover:text-white"
            >
              Voltar ao perfil
            </Link>
          </div>

          <div className="mt-5">
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
        </div>
      </main>
    </div>
  )
}
