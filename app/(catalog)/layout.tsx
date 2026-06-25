import { IconSidebar } from '@/components/layout/icon-sidebar'
import { BrandBar } from '@/components/layout/brand-bar'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
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
    <div className="min-h-screen bg-gate-bg pt-14">
      <BrandBar />
      <IconSidebar isAdmin={isAdmin} isArtist={isArtist} photoUrl={user?.photoUrl} />
      <main className="md:ml-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6">
          <Breadcrumbs />
        </div>
        {children}
      </main>
    </div>
  )
}
