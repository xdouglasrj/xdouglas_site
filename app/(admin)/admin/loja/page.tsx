import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { StoreItemsPanel } from './store-items-panel'
import { GiftPanel } from './gift-panel'
import { PromotionsPanel } from './promotions-panel'
import { PurchasesFeed } from './purchases-feed'
import { PriceAdjustmentHistory } from './price-adjustment-history'

export const metadata: Metadata = { title: 'Loja de pontos' }
export const dynamic = 'force-dynamic'

export default async function AdminLojaPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [items, promotions, recentPurchases, priceAdjustments] = await Promise.all([
    prisma.storeItem.findMany({ orderBy: { price: 'asc' } }),
    prisma.pointsPromotion.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.storePurchase.findMany({
      where: { purchasedAt: { gte: sevenDaysAgo } },
      include: {
        storeItem: { select: { label: true } },
        user: { select: { email: true, name: true, handle: true } },
      },
      orderBy: { purchasedAt: 'desc' },
      take: 100,
    }),
    prisma.storePriceAdjustment.findMany({
      include: { storeItem: { select: { label: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Loja de pontos</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Catálogo, presentes, promoções e o mercado de preço dinâmico da gamificação.
        </p>
      </div>

      <StoreItemsPanel items={items} />

      <div className="grid gap-6 md:grid-cols-2">
        <GiftPanel />
        <PromotionsPanel promotions={promotions} />
      </div>

      <PurchasesFeed purchases={recentPurchases} />

      <PriceAdjustmentHistory adjustments={priceAdjustments} />
    </div>
  )
}
