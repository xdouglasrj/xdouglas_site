import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { NewThreadForm } from './new-thread-form'

export const metadata: Metadata = { title: 'Novo tópico', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function NovoTopicoPage() {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} isArtist={user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'} mappingEnabled={user.mappingEnabled} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <Link href="/forum" className="inline-flex items-center gap-1.5 text-sm text-gate-blue hover:text-gate-pink transition mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            Voltar ao fórum
          </Link>
          <h1 className="text-xl font-bold text-white">Novo tópico</h1>
          <NewThreadForm />
        </div>
      </main>
    </div>
  )
}
