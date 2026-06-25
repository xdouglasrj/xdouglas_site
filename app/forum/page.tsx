import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { listThreads } from '@/lib/forum/forum'

export const metadata: Metadata = { title: 'Fórum', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

function authorName(a: { name: string | null; artisticName: string | null; username: string | null }) {
  return a.name || a.artisticName || a.username || 'Membro'
}

export default async function ForumPage() {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/')

  const { threads } = await listThreads()

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} isArtist={user.role === 'ARTIST' || user.role === 'ARTIST_SUPPORTER'} photoUrl={user.photoUrl} />

      <main className="md:ml-16 px-4 sm:px-8 py-8 sm:py-12">
        <Breadcrumbs />
        <div className="flex items-center justify-between max-w-2xl">
          <h1 className="text-2xl font-bold text-white">Fórum</h1>
          <Link
            href="/forum/novo"
            className="rounded-md bg-gate-pink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Novo tópico
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3 max-w-2xl">
          {threads.length === 0 && (
            <p className="text-sm text-white/40">Nenhum tópico ainda. Comece a discussão!</p>
          )}

          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/forum/${t.id}`}
              className="rounded-lg border border-gate-azure bg-white/5 p-4 transition hover:border-gate-pink"
            >
              <h2 className="text-sm font-semibold text-white">{t.title}</h2>
              <p className="mt-1 text-xs text-gate-blue">
                {authorName(t.author)} · {new Date(t.createdAt).toLocaleDateString('pt-BR')}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {t._count.replies} resposta{t._count.replies !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
