import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { FollowListPage } from '@/components/profile/follow-list-page'

export const metadata: Metadata = {
  title: 'Seguindo',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function SeguindoPage() {
  const token = await getAccessToken()
  if (!token) redirect('/inicio')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/inicio')

  const viewer = await getCurrentUserBasics()
  if (!viewer) redirect('/inicio')

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar
        isAdmin={viewer.role === 'ADMIN'}
        hasUploads={viewer.hasUploads}
        photoUrl={viewer.photoUrl}
        handle={viewer.handle}
      />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href={viewer.handle ? `/perfil/${viewer.handle}` : '/perfil'}
              className="text-sm text-gate-blue hover:text-gate-pink transition"
            >
              ← Meu perfil
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-white mb-6">Seguindo</h1>

          <FollowListPage userId={payload.userId} type="following" />
        </div>
      </main>
    </div>
  )
}
