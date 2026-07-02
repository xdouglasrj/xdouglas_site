import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Minhas playlists',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function PlaylistsPage() {
  const token = await getAccessToken()
  if (!token) redirect('/inicio')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/inicio')

  const playlists = await prisma.playlist.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tracks: true } } },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Minhas playlists</h1>
      </div>

      {playlists.length === 0 ? (
        <p className="text-sm text-white/40 py-12 text-center">
          Você ainda não criou nenhuma playlist.
        </p>
      ) : (
        <ul className="divide-y divide-gate-azure/40 rounded-lg border border-gate-azure bg-white/5">
          {playlists.map((pl) => (
            <li key={pl.id}>
              <Link
                href={`/biblioteca/playlists/${pl.id}`}
                className="flex items-center justify-between gap-4 p-4 transition hover:bg-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-white">{pl.name}</p>
                  {pl.description && (
                    <p className="text-xs text-white/40 mt-0.5 truncate">{pl.description}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-gate-blue">
                  {pl._count.tracks} {pl._count.tracks === 1 ? 'música' : 'músicas'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
