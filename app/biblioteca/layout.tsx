import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'

export default async function BibliotecaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar
        isAdmin={user.role === 'ADMIN'}
        hasUploads={user.hasUploads}
        photoUrl={user.photoUrl}
        handle={user.handle}
      />
      <main className="md:ml-16 md:pt-20">{children}</main>
    </div>
  )
}
