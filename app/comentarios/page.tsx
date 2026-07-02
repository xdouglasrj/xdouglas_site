import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Comentários',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function ComentariosPage() {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/inicio')

  const comments = await prisma.trackComment.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      track: {
        select: {
          slug: true,
          title: true,
          artist: { select: { name: true } },
        },
      },
    },
  })

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
          <h1 className="text-2xl font-bold text-white mb-6">Meus comentários</h1>

          {comments.length === 0 ? (
            <p className="text-sm text-white/40 py-12 text-center">
              Você ainda não fez nenhum comentário.
            </p>
          ) : (
            <ul className="divide-y divide-gate-azure/40 rounded-lg border border-gate-azure bg-white/5">
              {comments.map((c) => (
                <li key={c.id} className="p-4">
                  <Link
                    href={`/musica/${c.track.slug}`}
                    className="text-xs font-medium text-gate-blue hover:text-gate-pink transition"
                  >
                    {c.track.title}
                    {c.track.artist.name ? ` — ${c.track.artist.name}` : ''}
                  </Link>
                  <p className="mt-1 text-sm text-white/80">{c.content}</p>
                  <p className="mt-1 text-xs text-white/30">
                    {new Date(c.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
