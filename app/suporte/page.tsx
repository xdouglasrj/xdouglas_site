import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { SupportForm } from './support-form'

export const metadata: Metadata = {
  title: 'Suporte',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function SuportePage() {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/inicio')

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar
        isAdmin={user.role === 'ADMIN'}
        hasUploads={user.hasUploads}
        photoUrl={user.photoUrl}
        handle={user.handle}
      />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Suporte</h1>
          <p className="mt-2 text-sm text-white/50">
            Encontrou um problema, tem uma sugestão ou dúvida? Conta pra gente.
          </p>
          <SupportForm />
        </div>
      </main>
    </div>
  )
}
