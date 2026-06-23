import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'

export default async function CatalogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserBasics()
  const isAdmin = user?.role === 'ADMIN'
  const isArtist = user?.role === 'ARTIST' || user?.role === 'ARTIST_SUPPORTER'

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={isAdmin} isArtist={isArtist} photoUrl={user?.photoUrl} />
      <main className="md:ml-16">{children}</main>
    </div>
  )
}
