import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { NewThreadForm } from './new-thread-form'

export const metadata: Metadata = { title: 'Novo tópico', robots: { index: false, follow: false } }

export default async function NovoTopicoPage() {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} isArtist={user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'} photoUrl={user.photoUrl} />

      <main className="md:ml-16 px-4 sm:px-8 py-8 sm:py-12">
        <Breadcrumbs />
        <h1 className="text-2xl font-bold text-white max-w-xl">Novo tópico</h1>
        <NewThreadForm />
      </main>
    </div>
  )
}
