import { IconSidebar } from '@/components/layout/icon-sidebar'
import { PublicHeader } from '@/components/layout/public-header'
import { getCurrentUserBasics } from '@/lib/auth/current-user'

// (catalog) agora também recebe visitante anônimo — /musicas/[slug],
// /generos*, /artista/[slug] e /musicas-recentes são públicos (§3.1/§3.12
// do MAPA-E-PLANO-XDOUGLAS.md). Sem sessão, mostra um cabeçalho público
// minimalista em vez do trilho de navegação autenticado (que tem logout,
// upload, etc. — não faz sentido pra quem não tem conta).
export default async function CatalogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserBasics()
  const isAdmin = user?.role === 'ADMIN'

  if (!user) {
    return (
      <div className="min-h-screen bg-gate-bg">
        <PublicHeader />
        <main className="pt-14 md:pt-20">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar
        isAdmin={isAdmin}
        hasUploads={user.hasUploads ?? false}
        photoUrl={user.photoUrl}
        handle={user.handle}
      />
      <main className="md:ml-16 md:pt-20">
        {children}
      </main>
    </div>
  )
}
