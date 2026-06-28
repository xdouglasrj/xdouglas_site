import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { GlobalCommentsPage } from '@/components/social/global-comments-page'
import { getCurrentUserBasics } from '@/lib/auth/current-user'

export const metadata: Metadata = { title: 'Comentários', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function ComentariosIndexPage() {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} isArtist={user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'} mappingEnabled={user.mappingEnabled} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center">
        <GlobalCommentsPage />
      </main>
    </div>
  )
}
