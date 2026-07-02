import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminTopbar } from '@/components/admin/admin-topbar'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = await getAccessToken()

  if (!token) {
    redirect('/?login=1')
  }

  let role = ''
  let userId = ''
  try {
    const payload = await verifyAccessToken(token)
    role = payload.role
    userId = payload.userId
  } catch {
    redirect('/?login=1')
  }

  // Token válido não é suficiente: rotas /admin exigem ADMIN ou MODERATOR.
  // Sem isso, qualquer membro logado conseguia ver dados de todos
  // os usuários e da waitlist só por navegar até aqui.
  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    redirect('/?login=1')
  }

  // Permissões nunca vêm do JWT (podem mudar a qualquer momento) — sempre
  // lidas do banco. Moderador sem nenhuma permissão atribuída ainda não
  // está liberado para o painel.
  let permissions: string[] = []
  if (role === 'MODERATOR') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { permissions: true } })
    permissions = user?.permissions ?? []
    if (permissions.length === 0) {
      redirect('/?login=1')
    }
  }

  return (
    <div className="min-h-screen bg-gate-bg">
      {/* Sidebar — desktop, trilho de ícones fixo (padrão do site) */}
      <AdminSidebar role={role} permissions={permissions} />

      {/* Conteúdo principal */}
      <div className="flex flex-col min-w-0 md:ml-16">
        {/* Topbar — mobile */}
        <AdminTopbar role={role} permissions={permissions} />
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
