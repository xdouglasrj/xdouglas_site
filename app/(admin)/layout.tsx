import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminTopbar } from '@/components/admin/admin-topbar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = await getAccessToken()

  if (token) {
    try {
      await verifyAccessToken(token)
    } catch {
      redirect('/admin/login')
    }
  } else {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gate-bg">
      {/* Sidebar — desktop, trilho de ícones fixo (padrão do site) */}
      <AdminSidebar />

      {/* Conteúdo principal */}
      <div className="flex flex-col min-w-0 md:ml-16">
        {/* Topbar — mobile */}
        <AdminTopbar />
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
