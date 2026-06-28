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
  const mappingEnabled = user?.mappingEnabled ?? false

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar
        isAdmin={isAdmin}
        isArtist={isArtist}
        mappingEnabled={mappingEnabled}
        photoUrl={user?.photoUrl}
        handle={user?.handle}
      />
      <main className="md:ml-16 md:pt-20">
        {children}
      </main>
    </div>
  )
}
