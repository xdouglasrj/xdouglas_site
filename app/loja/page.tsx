import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCatalogForUser } from '@/lib/store/purchase-service'
import { getLevelName } from '@/lib/points/levels'
import { StoreCatalog } from './store-catalog'
import { StorageSubscriptionCard } from './storage-subscription-card'
import { Ranking } from './ranking'

export const metadata: Metadata = { title: 'Loja de pontos' }
export const dynamic = 'force-dynamic'

export default async function LojaPage() {
  const token = await getAccessToken()
  if (!token) redirect('/')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/')

  const viewer = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, photoUrl: true, handle: true, mappingEnabled: true, totalXp: true, level: true },
  })
  if (!viewer) redirect('/')

  const isArtist = viewer.role === 'ARTIST' || viewer.role === 'ARTIST_SUPPORTER'
  const isAdmin = viewer.role === 'ADMIN'

  const [{ items, spendableBalance }, myPurchases, topUsers, myRankAbove] = await Promise.all([
    getCatalogForUser(viewer.id),
    prisma.storePurchase.findMany({
      where: { userId: viewer.id },
      include: { storeItem: { select: { key: true, label: true } } },
      orderBy: { purchasedAt: 'desc' },
      take: 20,
    }),
    prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      orderBy: { totalXp: 'desc' },
      take: 10,
      select: { id: true, handle: true, name: true, artisticName: true, photoUrl: true, level: true },
    }),
    prisma.user.count({ where: { role: { not: 'ADMIN' }, totalXp: { gt: viewer.totalXp } } }),
  ])

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={isAdmin} isArtist={isArtist} mappingEnabled={viewer.mappingEnabled} photoUrl={viewer.photoUrl} handle={viewer.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Loja</h1>
              <p className="text-sm text-gate-blue">{getLevelName(viewer.level)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40">Seu saldo</p>
              <p className="text-lg font-bold text-gate-pink">{spendableBalance.toLocaleString('pt-BR')} pts</p>
            </div>
          </div>

          <StoreCatalog items={items} myPurchases={myPurchases} spendableBalance={spendableBalance} />

          {isArtist && <StorageSubscriptionCard />}

          <Ranking users={topUsers} viewerId={viewer.id} viewerRankPosition={myRankAbove + 1} viewerTotalXp={viewer.totalXp} />
        </div>
      </main>
    </div>
  )
}
