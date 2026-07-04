import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { StoreItemsPanel } from './store-items-panel'
import { GiftPanel } from './gift-panel'
import { PromotionsPanel } from './promotions-panel'
import { PurchasesFeed } from './purchases-feed'
import { PriceAdjustmentHistory } from './price-adjustment-history'
import { HighlightsPanel, type AdminHighlightRow } from './highlights-panel'

export const metadata: Metadata = { title: 'Loja de pontos' }
export const dynamic = 'force-dynamic'

export default async function AdminLojaPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const now = new Date()

  const [items, promotions, recentPurchases, priceAdjustments, highlightRows] = await Promise.all([
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
    prisma.trackHighlight.findMany({
      include: {
        track: { select: { title: true } },
        user: { select: { email: true, name: true, handle: true } },
      },
      orderBy: { startsAt: 'desc' },
      take: 100,
    }),
  ])

  const highlights: AdminHighlightRow[] = highlightRows.map((h) => ({
    id: h.id,
    trackTitle: h.track.title,
    userLabel: h.user.handle ? `@${h.user.handle}` : h.user.name ?? h.user.email,
    costPoints: h.costPoints,
    startsAt: h.startsAt.toISOString(),
    endsAt: h.endsAt.toISOString(),
    canceledAt: h.canceledAt?.toISOString() ?? null,
    isActive: !h.canceledAt && h.endsAt > now,
  }))

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

      <HighlightsPanel highlights={highlights} />

      <PriceAdjustmentHistory adjustments={priceAdjustments} />
    </div>
  )
}
