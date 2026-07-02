import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Curtidas',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function CurtidasPage() {
  const token = await getAccessToken()
  if (!token) redirect('/')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/')

  const likes = await prisma.trackLike.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      track: {
        select: {
          id: true, slug: true, title: true, coverUrl: true, genre: true,
          artist: { select: { name: true } },
        },
      },
    },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Curtidas</h1>
        <p className="mt-1 text-sm text-gate-blue">Músicas que você curtiu.</p>
      </div>

      {likes.length === 0 ? (
        <p className="text-sm text-gate-blue">Você ainda não curtiu nenhuma música.</p>
      ) : (
        <ul className="rounded-xl border border-gate-azure bg-white/5 divide-y divide-gate-azure overflow-hidden">
          {likes.map(({ track }) => (
            <li key={track.id}>
              <Link href={`/musicas/${track.slug}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/10">
                  {track.coverUrl && (
                    <Image src={track.coverUrl} alt="" fill sizes="40px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{track.title}</p>
                  <p className="truncate text-xs text-gate-blue">
                    {track.artist.name}
                    {track.genre && ` · ${track.genre}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
