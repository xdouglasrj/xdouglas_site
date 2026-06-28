import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { SupportForm } from './support-form'

export const metadata: Metadata = { title: 'Suporte', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function SuportePage() {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} isArtist={user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'} mappingEnabled={user.mappingEnabled} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="mx-auto max-w-xl">
          <h1 className="text-2xl font-bold text-white">Suporte</h1>
          <p className="mt-1.5 text-sm text-white/50">
            Encontrou um problema ou tem uma sugestão? Descreva abaixo e, se puder, anexe uma foto ou vídeo —
            isso nos ajuda a entender e resolver mais rápido.
          </p>

          <SupportForm />
        </div>
      </main>
    </div>
  )
}
