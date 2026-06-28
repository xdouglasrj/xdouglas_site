import { prisma } from '@/lib/prisma'

/**
 * Roda periodicamente (cron): expira compras AWAITING_USE cujo prazo de
 * uso passou (sem reembolso), e limpa os efeitos de destaque/fixação que
 * já passaram da validade. Os campos de expiração (featuredUntil,
 * pinnedExpiresAt) já são ignorados nas queries de exibição por
 * comparação com `> now`, então isto é manutenção, não correção de bug —
 * evita que as linhas fiquem "sujas" indefinidamente no banco.
 */
export async function runStoreCleanup() {
  const now = new Date()

  const expiredPurchases = await prisma.storePurchase.updateMany({
    where: { status: 'AWAITING_USE', usableUntil: { lt: now } },
    data: { status: 'EXPIRED' },
  })

  const unfeaturedTracks = await prisma.track.updateMany({
    where: { featuredUntil: { lt: now } },
    data: { featuredUntil: null },
  })

  const unpinnedTrackComments = await prisma.trackComment.updateMany({
    where: { pinnedExpiresAt: { lt: now } },
    data: { pinned: false, pinnedAt: null, pinnedExpiresAt: null },
  })

  const unpinnedPosts = await prisma.post.updateMany({
    where: { pinnedExpiresAt: { lt: now } },
    data: { pinned: false, pinnedAt: null, pinnedExpiresAt: null },
  })

  return {
    ranAt: now.toISOString(),
    expiredPurchases: expiredPurchases.count,
    unfeaturedTracks: unfeaturedTracks.count,
    unpinnedTrackComments: unpinnedTrackComments.count,
    unpinnedPosts: unpinnedPosts.count,
  }
}
