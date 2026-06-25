import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { WelcomeToast } from '@/components/gate/WelcomeToast'
import { getCurrentUserBasics } from '@/lib/auth/current-user'

export const metadata: Metadata = {
  title: 'Início',
  robots: { index: false, follow: false },
}

interface InicioPageProps {
  searchParams: Promise<{ welcomeName?: string; firstToday?: string }>
}

export default async function InicioPage({ searchParams }: InicioPageProps) {
  const { welcomeName, firstToday } = await searchParams
  const user = await getCurrentUserBasics()
  const isAdmin = user?.role === 'ADMIN'
  const isArtist = user?.role === 'ARTIST' || user?.role === 'ARTIST_SUPPORTER'

  return (
    <div className="min-h-screen bg-gate-bg">
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center">
        <Image
          src="/brand/xdouglas-logo.png"
          alt="xDouglas"
          width={1200}
          height={675}
          priority
          className="h-12 w-auto object-contain sm:h-28"
        />
      </div>
      <IconSidebar isAdmin={isAdmin} isArtist={isArtist} photoUrl={user?.photoUrl} />

      {welcomeName && (
        <WelcomeToast name={welcomeName} firstToday={firstToday === '1'} />
      )}

      <main className="md:ml-16 px-4 sm:px-8 py-8 sm:py-12">
        <Breadcrumbs />
        <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
        <p className="mt-2 max-w-md text-sm text-gate-blue">
          Use o ícone de música na barra lateral para explorar por gênero, ou a lupa para
          buscar um artista ou uma música específica.
        </p>

        <Link
          href="/musicas"
          className="mt-8 inline-block rounded-lg bg-gate-pink px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Ver catálogo completo
        </Link>
      </main>
    </div>
  )
}
