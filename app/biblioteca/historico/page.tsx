import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getRecentHistory } from '@/lib/social/listening-history'
import { HistoryList } from '@/components/music/history-list'

export const metadata: Metadata = {
  title: 'Histórico de escuta',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// Histórico é PRIVADO — nunca exposto em perfil público, só o dono acessa
// esta página (mesma proteção de /biblioteca/curtidas).
export default async function HistoricoPage() {
  const token = await getAccessToken()
  if (!token) redirect('/inicio')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/inicio')

  const entries = await getRecentHistory(payload.userId)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Histórico de escuta</h1>
      </div>

      <HistoryList entries={entries} />
    </div>
  )
}
