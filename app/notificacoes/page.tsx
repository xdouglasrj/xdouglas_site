import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { listNotifications, markNotificationsRead } from '@/lib/notifications/notifications'

export const metadata: Metadata = { title: 'Notificações', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

type NotificationPayload = Record<string, unknown>

function describeNotification(type: string, payload: NotificationPayload): { text: string; href: string } {
  switch (type) {
    case 'novo_seguidor':
      return {
        text: `${payload.actorName ?? 'Alguém'} começou a seguir você.`,
        href: payload.actorHandle ? `/perfil/${payload.actorHandle}` : '/perfil',
      }
    case 'curtida':
      return {
        text: `${payload.actorName ?? 'Alguém'} curtiu sua música "${payload.trackTitle ?? ''}".`,
        href: payload.trackSlug ? `/musicas/${payload.trackSlug}` : '/musicas-recentes',
      }
    case 'comentario':
      return {
        text: `${payload.actorName ?? 'Alguém'} comentou em "${payload.trackTitle ?? ''}".`,
        href: payload.trackSlug ? `/musicas/${payload.trackSlug}` : '/musicas-recentes',
      }
    case 'resposta_forum':
      return {
        text: `${payload.actorName ?? 'Alguém'} respondeu seu tópico "${payload.threadTitle ?? ''}".`,
        href: payload.sectorSlug && payload.threadId ? `/forum/${payload.sectorSlug}/${payload.threadId}` : '/forum',
      }
    case 'musica_publicada':
      return {
        text: `Sua música "${payload.trackTitle ?? ''}" foi publicada.`,
        href: payload.trackSlug ? `/musicas/${payload.trackSlug}` : '/musicas-recentes',
      }
    case 'presente_admin':
      return { text: `Você recebeu um presente do time xDouglas.`, href: '/loja' }
    default:
      return { text: 'Você tem uma nova notificação.', href: '/notificacoes' }
  }
}

export default async function NotificacoesPage({ searchParams }: PageProps) {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const { notifications, totalPages } = await listNotifications(user.id, { page })

  // Abrir a central de notificações marca tudo como lido
  await markNotificationsRead(user.id)

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} hasUploads={user.hasUploads} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-white mb-6">Notificações</h1>

          {notifications.length === 0 ? (
            <p className="text-center text-sm text-white/40 py-12">Nenhuma notificação ainda.</p>
          ) : (
            <ul className="divide-y divide-gate-azure/40 rounded-lg border border-gate-azure bg-white/5">
              {notifications.map((n) => {
                const { text, href } = describeNotification(n.type, n.payload as NotificationPayload)
                return (
                  <li key={n.id}>
                    <Link
                      href={href}
                      className={`flex items-start gap-3 p-4 transition hover:bg-white/5 ${!n.read ? 'bg-gate-pink/5' : ''}`}
                    >
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gate-pink" />}
                      <div className={`flex-1 min-w-0 ${n.read ? 'pl-5' : ''}`}>
                        <p className="text-sm text-white">{text}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {new Date(n.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/notificacoes?page=${p}`}
                  className={`rounded-md px-3 py-1.5 ${p === page ? 'bg-gate-pink text-white' : 'text-white/50 hover:bg-white/5'}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
