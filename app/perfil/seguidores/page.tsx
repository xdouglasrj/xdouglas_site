import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { FollowListPage } from '@/components/profile/follow-list-page'

export const metadata: Metadata = { title: 'Seguidores', robots: { index: false, follow: false } }

export default async function SeguidoresPage() {
  const token = await getAccessToken()
  if (!token) redirect('/')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, photoUrl: true, handle: true },
  })
  if (!user) redirect('/')

  const uploadCount = await prisma.track.count({ where: { submittedById: user.id } })

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} hasUploads={uploadCount > 0} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-white">Seguidores</h1>
            <Link
              href={user.handle ? `/perfil/${user.handle}` : '/perfil'}
              className="text-sm text-gate-blue transition hover:text-white"
            >
              Voltar ao perfil
            </Link>
          </div>

          <div className="mt-5">
            <FollowListPage userId={user.id} type="followers" />
          </div>
        </div>
      </main>
    </div>
  )
}
