import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { getThread } from '@/lib/forum/forum'
import { Avatar } from '@/components/ui/avatar'
import { ReplyForm } from './reply-form'
import { LockThreadButton } from './lock-thread-button'

export const dynamic = 'force-dynamic'

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
      <IconSidebar isAdmin={user.role === 'ADMIN'} isArtist={user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'} mappingEnabled={user.mappingEnabled} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <Link href="/forum" className="inline-flex items-center gap-1.5 text-sm text-gate-blue hover:text-gate-pink transition mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            Voltar ao fórum
          </Link>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {thread.pinned && (
                <span className="rounded-full bg-gate-pink/15 px-2 py-0.5 text-[10px] font-medium text-gate-pink">
                  Fixado
                </span>
              )}
              {thread.locked && (
                <span className="rounded-full bg-orange-950/40 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                  Bloqueado
                </span>
              )}
            </div>
            {user.role === 'ADMIN' && <LockThreadButton threadId={thread.id} initialLocked={thread.locked} />}
          </div>

          <h1 className="mt-2 text-xl font-bold text-white">{thread.title}</h1>

          <div className="mt-3 flex items-center gap-3">
            <Avatar photoUrl={thread.author.photoUrl} alt={thread.author.name ?? thread.author.handle ?? ''} size={32} />
            <div>
              <p className="text-sm text-white">{thread.author.artisticName || thread.author.name || `@${thread.author.handle}`}</p>
              <p className="text-xs text-white/40">{new Date(thread.createdAt).toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm text-white/80">{thread.body}</p>

          <h2 className="mt-8 text-xs font-bold uppercase tracking-widest text-gate-blue">
            {thread.replies.length} {thread.replies.length === 1 ? 'resposta' : 'respostas'}
          </h2>

          <ul className="mt-3 space-y-4">
            {thread.replies.map((reply) => (
              <li key={reply.id} className="flex items-start gap-3">
                <Avatar photoUrl={reply.author.photoUrl} alt={reply.author.name ?? reply.author.handle ?? ''} size={28} />
                <div className="flex-1 rounded-lg border border-gate-azure bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-white">
                      {reply.author.artisticName || reply.author.name || `@${reply.author.handle}`}
                    </p>
                    <p className="text-[10px] text-white/30">{new Date(reply.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">{reply.body}</p>
                </div>
              </li>
            ))}
          </ul>

          {thread.locked ? (
            <p className="mt-6 rounded-lg border border-orange-900/50 bg-orange-950/20 px-4 py-3 text-center text-sm text-orange-400">
              Este tópico está bloqueado — não é possível responder.
            </p>
          ) : (
            <ReplyForm threadId={thread.id} />
          )}
        </div>
      </main>
    </div>
  )
}
