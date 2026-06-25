import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { ReportButton } from '@/components/social/report-button'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { getThread } from '@/lib/forum/forum'
import { ReplyForm } from './reply-form'

function authorName(a: { name: string | null; artisticName: string | null }) {
  return a.name || a.artisticName || 'Membro'
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface PageProps {
  params: Promise<{ topico: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topico } = await params
  const thread = await getThread(topico)
  return { title: thread?.title ?? 'Tópico', robots: { index: false, follow: false } }
}

export default async function TopicoPage({ params }: PageProps) {
  const { topico } = await params
  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  const thread = await getThread(topico)
  if (!thread) notFound()

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} isArtist={user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl">
          <article className="rounded-lg border border-gate-azure bg-white/5 p-5">
            <h1 className="text-xl font-bold text-white">{thread.title}</h1>
            <p className="mt-1 text-xs text-gate-blue">
              {authorName(thread.author)} · {formatDate(thread.createdAt)}
            </p>
            <p className="mt-4 text-sm text-white/90 whitespace-pre-wrap break-words">{thread.body}</p>
            <div className="mt-3">
              <ReportButton targetType="FORUM_THREAD" targetId={thread.id} />
            </div>
          </article>

          <h2 className="mt-8 mb-3 text-sm font-semibold text-white">
            {thread.replies.length} resposta{thread.replies.length !== 1 ? 's' : ''}
          </h2>

          <div className="flex flex-col gap-3">
            {thread.replies.map((r) => (
              <div key={r.id} className="rounded-lg border border-gate-azure bg-white/5 p-4">
                <p className="text-xs text-gate-blue">
                  <span className="font-semibold text-white">{authorName(r.author)}</span> · {formatDate(r.createdAt)}
                </p>
                <p className="mt-2 text-sm text-white/80 whitespace-pre-wrap break-words">{r.body}</p>
                <div className="mt-2">
                  <ReportButton targetType="FORUM_REPLY" targetId={r.id} />
                </div>
              </div>
            ))}
          </div>

          <ReplyForm threadId={thread.id} />
        </div>
      </main>
    </div>
  )
}
