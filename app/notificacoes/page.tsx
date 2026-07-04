import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { listNotifications, markNotificationsRead } from '@/lib/notifications/notifications'

export const metadata: Metadata = {
  title: 'Notificações',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ page?: string; filter?: string }>
}

type NotificationPayload = {
  actorName?: string
  actorHandle?: string
  trackTitle?: string
  trackSlug?: string
  threadTitle?: string
  threadId?: string
  sectorSlug?: string
  milestonePlays?: number
  eventTitle?: string
  eventSlug?: string
  artistName?: string
  contestTitle?: string
  contestSlug?: string
  won?: boolean
}

function notificationLabel(type: string, payload: NotificationPayload): { text: string; href: string | null } {
  const actor = payload.actorName ?? 'Alguém'
  switch (type) {
    case 'novo_seguidor':
      return {
        text: `${actor} começou a seguir você.`,
        href: payload.actorHandle ? `/perfil/${payload.actorHandle}` : null,
      }
    case 'curtida':
      return {
        text: `${actor} curtiu sua música "${payload.trackTitle ?? ''}"`,
        href: payload.trackSlug ? `/musica/${payload.trackSlug}` : null,
      }
    case 'comentario':
      return {
        text: `${actor} comentou na sua música "${payload.trackTitle ?? ''}"`,
        href: payload.trackSlug ? `/musica/${payload.trackSlug}` : null,
      }
    case 'resposta_forum':
      return {
        text: `${actor} respondeu ao seu tópico "${payload.threadTitle ?? ''}"`,
        href:
          payload.sectorSlug && payload.threadId
            ? `/forum/${payload.sectorSlug}/${payload.threadId}`
            : null,
      }
    case 'musica_publicada':
      return {
        text: `Sua música "${payload.trackTitle ?? ''}" foi publicada.`,
        href: payload.trackSlug ? `/musica/${payload.trackSlug}` : null,
      }
    case 'presente_admin':
      return {
        text: `Você recebeu um presente do admin.`,
        href: '/loja',
      }
    case 'resposta_comentario':
      return {
        text: `${actor} respondeu ao seu comentário em "${payload.trackTitle ?? ''}"`,
        href: payload.trackSlug ? `/musicas/${payload.trackSlug}` : null,
      }
    case 'curtida_comentario':
      return {
        text: `${actor} curtiu seu comentário em "${payload.trackTitle ?? ''}"`,
        href: payload.trackSlug ? `/musicas/${payload.trackSlug}` : null,
      }
    case 'repost':
      return {
        text: `${actor} repostou sua música "${payload.trackTitle ?? ''}"`,
        href: payload.trackSlug ? `/musicas/${payload.trackSlug}` : null,
      }
    case 'marco_plays':
      return {
        text: `🎉 Sua faixa "${payload.trackTitle ?? ''}" passou de ${(payload.milestonePlays ?? 0).toLocaleString('pt-BR')} plays!`,
        href: payload.trackSlug ? `/musica/${payload.trackSlug}` : null,
      }
    case 'evento_publicado':
      return {
        text: `${payload.artistName ?? 'Um artista que você segue'} anunciou um novo evento: "${payload.eventTitle ?? ''}"`,
        href: '/eventos',
      }
    case 'contest_publicado':
      return {
        text: `${payload.artistName ?? 'Um artista que você segue'} publicou um novo concurso: "${payload.contestTitle ?? ''}"`,
        href: payload.contestSlug ? `/contests/${payload.contestSlug}` : '/contests',
      }
    case 'contest_resultado':
      return {
        text: `🏆 Você venceu o concurso "${payload.contestTitle ?? ''}"!`,
        href: payload.contestSlug ? `/contests/${payload.contestSlug}` : '/contests',
      }
    default:
      return { text: 'Nova notificação.', href: null }
  }
}

export default async function NotificacoesPage({ searchParams }: PageProps) {
  const { page: pageParam, filter: filterParam } = await searchParams

  const user = await getCurrentUserBasics()
  if (!user) redirect('/inicio')

  const page = Math.max(1, Number(pageParam) || 1)
  const filter = filterParam === 'unread' ? 'unread' : 'all'

  const { notifications, totalPages } = await listNotifications(user.id, { page, filter })

  // Mark all fetched notifications as read (fire-and-forget)
  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
  if (unreadIds.length > 0) {
    markNotificationsRead(user.id, unreadIds).catch((err) =>
      console.error('[Notificacoes] Falha ao marcar como lidas', err)
    )
  }

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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Notificações</h1>
            <div className="flex gap-2 text-xs">
              <Link
                href="/notificacoes"
                className={`rounded-full px-3 py-1.5 border transition ${
                  filter === 'all'
                    ? 'border-gate-pink bg-gate-pink/15 text-gate-pink'
                    : 'border-gate-azure text-gate-blue hover:border-gate-pink hover:text-gate-pink'
                }`}
              >
                Todas
              </Link>
              <Link
                href="/notificacoes?filter=unread"
                className={`rounded-full px-3 py-1.5 border transition ${
                  filter === 'unread'
                    ? 'border-gate-pink bg-gate-pink/15 text-gate-pink'
                    : 'border-gate-azure text-gate-blue hover:border-gate-pink hover:text-gate-pink'
                }`}
              >
                Não lidas
              </Link>
            </div>
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-white/40 py-12 text-center">
              {filter === 'unread' ? 'Nenhuma notificação não lida.' : 'Nenhuma notificação ainda.'}
            </p>
          ) : (
            <ul className="divide-y divide-gate-azure/40 rounded-lg border border-gate-azure bg-white/5">
              {notifications.map((n) => {
                const payload = (n.payload ?? {}) as NotificationPayload
                const { text, href } = notificationLabel(n.type, payload)
                const inner = (
                  <div className={`p-4 ${!n.read ? 'bg-gate-pink/5' : ''}`}>
                    <p className={`text-sm ${!n.read ? 'text-white font-medium' : 'text-white/70'}`}>
                      {text}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )
                return (
                  <li key={n.id}>
                    {href ? (
                      <Link href={href} className="block transition hover:bg-white/5">
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
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
                  href={`/notificacoes?page=${p}${filter === 'unread' ? '&filter=unread' : ''}`}
                  className={`rounded-md px-3 py-1.5 ${
                    p === page ? 'bg-gate-pink text-white' : 'text-white/50 hover:bg-white/5'
                  }`}
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
