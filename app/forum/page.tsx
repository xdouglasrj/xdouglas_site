import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'

export const metadata: Metadata = { title: 'Fórum', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function ForumPage() {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} isArtist={user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'} mappingEnabled={user.mappingEnabled} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gate-blue">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-white">Fórum em desenvolvimento</h1>
          <p className="mt-2 max-w-sm text-sm text-white/50">
            Estamos construindo o resto da comunidade primeiro — o fórum chega em uma próxima etapa.
          </p>
        </div>
      </main>
    </div>
  )
}
