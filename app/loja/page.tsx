import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { prisma } from '@/lib/prisma'
import { getSpendableBalance } from '@/lib/points/points-service'
import { StoreCatalog } from './store-catalog'
import { Ranking } from './ranking'
import { PaymentReturnBanner } from './payment-return-banner'
import { StorageSubscriptionCard } from './storage-subscription-card'

export const metadata: Metadata = {
  title: 'Loja',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function LojaPage() {
  const token = await getAccessToken()
  if (!token) redirect('/inicio')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/inicio')

  const viewer = await getCurrentUserBasics()
  if (!viewer) redirect('/inicio')

  const [storeItems, myPurchases, spendableBalance, viewerUser, topUsers] = await Promise.all([
    prisma.storeItem.findMany({ orderBy: { price: 'asc' } }),
    prisma.storePurchase.findMany({
      where: { userId: payload.userId },
      orderBy: { purchasedAt: 'desc' },
      include: { storeItem: { select: { key: true, label: true } } },
    }),
    getSpendableBalance(payload.userId),
    prisma.user.findUnique({
      where: { id: payload.userId },
      select: { totalXp: true, level: true },
    }),
    prisma.user.findMany({
      where: { active: true, blocked: false },
      orderBy: { totalXp: 'desc' },
      take: 10,
      select: {
        id: true,
        handle: true,
        name: true,
        artisticName: true,
        photoUrl: true,
        level: true,
      },
    }),
  ])

  const viewerTotalXp = viewerUser?.totalXp ?? 0
  const viewerRankPosition =
    (await prisma.user.count({
      where: { active: true, blocked: false, totalXp: { gt: viewerTotalXp } },
    })) + 1

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar
        isAdmin={viewer.role === 'ADMIN'}
        hasUploads={viewer.hasUploads}
        photoUrl={viewer.photoUrl}
        handle={viewer.handle}
      />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <PaymentReturnBanner />

          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">Loja</h1>
            <div className="text-right">
              <p className="text-xs text-gate-blue uppercase tracking-widest">Seu saldo</p>
              <p className="text-lg font-bold text-gate-pink">
                {spendableBalance.toLocaleString('pt-BR')} pts
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-white/50">
              Troque seus pontos por itens e benefícios exclusivos.
            </p>
            <Link href="/ganhe-pontos" className="shrink-0 text-xs text-gate-blue hover:text-gate-pink transition">
              Ganhe pontos →
            </Link>
          </div>

          <StoreCatalog
            items={storeItems}
            myPurchases={myPurchases}
            spendableBalance={spendableBalance}
          />

          <div className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue mb-4">
              Armazenamento extra
            </h2>
            <StorageSubscriptionCard />
          </div>

          <Ranking
            users={topUsers}
            viewerId={payload.userId}
            viewerRankPosition={viewerRankPosition}
            viewerTotalXp={viewerTotalXp}
          />
        </div>
      </main>
    </div>
  )
}
