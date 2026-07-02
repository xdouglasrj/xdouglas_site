import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Músicas curtidas',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function CurtidasPage() {
  const token = await getAccessToken()
  if (!token) redirect('/inicio')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/inicio')

  const likes = await prisma.trackLike.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      track: {
        select: {
          id: true,
          slug: true,
          title: true,
          coverUrl: true,
          artist: { select: { name: true } },
        },
      },
    },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Músicas curtidas</h1>

      {likes.length === 0 ? (
        <p className="text-sm text-white/40 py-12 text-center">
          Você ainda não curtiu nenhuma música.
        </p>
      ) : (
        <ul className="divide-y divide-gate-azure/40 rounded-lg border border-gate-azure bg-white/5">
          {likes.map(({ track }) => (
            <li key={track.id}>
              <Link
                href={`/musica/${track.slug}`}
                className="flex items-center gap-3 p-4 transition hover:bg-white/5"
              >
                {track.coverUrl ? (
                  <Image
                    src={track.coverUrl}
                    alt={track.title}
                    width={40}
                    height={40}
                    className="rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 shrink-0 rounded-md bg-white/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gate-blue">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{track.title}</p>
                  <p className="text-xs text-white/40 truncate">{track.artist.name}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
