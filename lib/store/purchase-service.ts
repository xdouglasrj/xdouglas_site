import { StoreItemKey, StorePurchaseStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { spendPoints, InsufficientPointsError } from '@/lib/points/points-service'

export class StoreError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

/** Catálogo visível pro usuário (filtrado por audiência) + saldo gastável. */
export async function getCatalogForUser(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true } })
  const isArtist = user.role === 'ARTIST'
  const audiences: ('ARTIST' | 'LISTENER' | 'BOTH')[] = isArtist ? ['ARTIST', 'BOTH'] : ['LISTENER', 'BOTH']

  const [items, balance] = await Promise.all([
    prisma.storeItem.findMany({ where: { active: true, audience: { in: audiences } }, orderBy: { price: 'asc' } }),
    prisma.pointsHistory.aggregate({ where: { userId }, _sum: { points: true } }),
  ])

  return { items, spendableBalance: balance._sum.points ?? 0 }
}

/**
 * Compra um item. Itens de efeito imediato (convite, armazenamento,
 * mapeamento, premium) já aplicam o efeito aqui. Itens de slot (destaque
 * de faixa, fixar comentário) ficam AWAITING_USE até o usuário escolher o
 * alvo em useStorePurchase().
 */
export async function purchaseItem(
  userId: string,
  itemKey: StoreItemKey,
  opts?: { referEmail?: string }
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    const item = await tx.storeItem.findUnique({ where: { key: itemKey } })

    if (!item || !item.active) throw new StoreError('ITEM_NOT_FOUND', 'Item não encontrado')

    const isArtist = user.role === 'ARTIST'
    if (item.audience === 'ARTIST' && !isArtist) {
      throw new StoreError('WRONG_AUDIENCE', 'Item exclusivo de artista')
    }
    if (item.audience === 'LISTENER' && isArtist) {
      throw new StoreError('WRONG_AUDIENCE', 'Item exclusivo de ouvinte')
    }

    if (item.key === 'PRIORITY_INVITE' && user.inviteBlockedUntil && user.inviteBlockedUntil > new Date()) {
      throw new StoreError('INVITE_BLOCKED', 'Função de convidar bloqueada por abuso até ' + user.inviteBlockedUntil.toLocaleDateString('pt-BR'))
    }

    if (item.maxPurchasesPerUser) {
      const owned = await tx.storePurchase.count({ where: { userId, storeItemId: item.id } })
      if (owned >= item.maxPurchasesPerUser) {
        throw new StoreError('MAX_PURCHASES_REACHED', 'Limite de compras desse item atingido')
      }
    }

    if (item.saleWindowHours && item.saleWindowLimit) {
      const windowStart = new Date(Date.now() - item.saleWindowHours * 60 * 60 * 1000)
      const soldInWindow = await tx.storePurchase.count({
        where: { storeItemId: item.id, purchasedAt: { gte: windowStart } },
      })
      if (soldInWindow >= item.saleWindowLimit) {
        throw new StoreError('SALE_WINDOW_FULL', 'Vagas de venda esgotadas nas últimas horas, tente mais tarde')
      }
    }

    // Debita o saldo (lança InsufficientPointsError se não tiver pontos)
    const balance = await tx.pointsHistory.aggregate({ where: { userId }, _sum: { points: true } })
    const current = balance._sum.points ?? 0
    if (current < item.price) throw new InsufficientPointsError()

    await tx.pointsHistory.create({
      data: { userId, action: 'STORE_REDEMPTION', points: -item.price, description: `Compra: ${item.label}` },
    })

    const now = new Date()
    let status: StorePurchaseStatus = 'AWAITING_USE'
    let usableUntil: Date | null = item.durationHours ? hoursFromNow(item.durationHours) : null
    let usedAt: Date | null = null
    let expiresAt: Date | null = null
    let targetType: string | null = null
    let targetId: string | null = null

    switch (item.key) {
      case 'PRIORITY_INVITE': {
        if (!opts?.referEmail) throw new StoreError('MISSING_EMAIL', 'Email de quem você quer indicar é obrigatório')
        const email = opts.referEmail.trim().toLowerCase()

        const existing = await tx.waitlist.findUnique({ where: { email } })
        if (existing) {
          await tx.waitlist.update({
            where: { email },
            data: { referredByUserId: userId, priority: true },
          })
        } else {
          await tx.waitlist.create({
            data: {
              email,
              tipoUsuario: 'OUTRO',
              consentedAt: now,
              referredByUserId: userId,
              priority: true,
            },
          })
        }
        status = 'USED'
        usedAt = now
        targetType = 'WAITLIST_EMAIL'
        targetId = email
        break
      }

      case 'EXTRA_STORAGE': {
        await tx.user.update({ where: { id: userId }, data: { bonusStorageMb: { increment: 200 } } })
        status = 'USED'
        usedAt = now
        break
      }

      case 'MAPPING_ACCESS': {
        const base = user.mappingExpiresAt && user.mappingExpiresAt > now ? user.mappingExpiresAt : now
        const newExpiry = new Date(base.getTime() + (item.durationHours ?? 0) * 60 * 60 * 1000)
        await tx.user.update({ where: { id: userId }, data: { mappingExpiresAt: newExpiry } })
        status = 'USED'
        usedAt = now
        expiresAt = newExpiry
        break
      }

      case 'APP_PREMIUM': {
        const base = user.appPremiumExpiresAt && user.appPremiumExpiresAt > now ? user.appPremiumExpiresAt : now
        const newExpiry = new Date(base.getTime() + (item.durationHours ?? 0) * 60 * 60 * 1000)
        await tx.user.update({ where: { id: userId }, data: { appPremiumExpiresAt: newExpiry } })
        status = 'USED'
        usedAt = now
        expiresAt = newExpiry
        break
      }

      // FEATURE_TRACK, PIN_TRACK_COMMENT, PIN_FEED_POST — ficam aguardando
      // o usuário escolher o alvo em useStorePurchase()
      default:
        status = 'AWAITING_USE'
    }

    const purchase = await tx.storePurchase.create({
      data: {
        userId,
        storeItemId: item.id,
        pricePaid: item.price,
        status,
        targetType,
        targetId,
        usableUntil,
        usedAt,
        expiresAt,
      },
    })

    return purchase
  })
}

/**
 * Usa um item AWAITING_USE (destaque de faixa, fixar comentário/post).
 * O prazo de uso e a duração do efeito compartilham o mesmo relógio
 * (usableUntil) — usar tarde não ganha tempo extra de exibição.
 */
export async function useStorePurchase(
  purchaseId: string,
  userId: string,
  targetId: string
) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.storePurchase.findUnique({
      where: { id: purchaseId },
      include: { storeItem: true },
    })

    if (!purchase || purchase.userId !== userId) {
      throw new StoreError('NOT_FOUND', 'Compra não encontrada')
    }
    if (purchase.status !== 'AWAITING_USE') {
      throw new StoreError('NOT_AWAITING_USE', 'Este item já foi usado ou expirou')
    }
    if (purchase.usableUntil && purchase.usableUntil < new Date()) {
      await tx.storePurchase.update({ where: { id: purchase.id }, data: { status: 'EXPIRED' } })
      throw new StoreError('EXPIRED', 'O prazo pra usar esse item já passou — sem reembolso')
    }

    const expiresAt = purchase.usableUntil

    if (purchase.storeItem.key === 'FEATURE_TRACK') {
      const track = await tx.track.findUnique({ where: { id: targetId }, include: { artist: true } })
      if (!track || track.artist.userId !== userId) {
        throw new StoreError('INVALID_TARGET', 'Faixa não encontrada ou não é sua')
      }

      const concurrent = await tx.track.count({ where: { featuredUntil: { gt: new Date() } } })
      if (purchase.storeItem.maxConcurrent && concurrent >= purchase.storeItem.maxConcurrent) {
        throw new StoreError('SLOTS_FULL', 'Todas as vagas de destaque estão ocupadas agora')
      }

      await tx.track.update({ where: { id: targetId }, data: { featuredUntil: expiresAt } })
      await tx.storePurchase.update({
        where: { id: purchase.id },
        data: { status: 'USED', usedAt: new Date(), expiresAt, targetType: 'TRACK', targetId },
      })
    } else if (purchase.storeItem.key === 'PIN_TRACK_COMMENT') {
      const comment = await tx.trackComment.findUnique({
        where: { id: targetId },
        include: { track: { include: { artist: true } } },
      })
      if (!comment || comment.track.artist.userId !== userId) {
        throw new StoreError('INVALID_TARGET', 'Comentário não encontrado ou não é de uma música sua')
      }

      const concurrent = await tx.trackComment.count({ where: { pinnedExpiresAt: { gt: new Date() } } })
      if (purchase.storeItem.maxConcurrent && concurrent >= purchase.storeItem.maxConcurrent) {
        throw new StoreError('SLOTS_FULL', 'Todas as vagas de destaque de comentário estão ocupadas agora')
      }

      await tx.trackComment.update({
        where: { id: targetId },
        data: { pinned: true, pinnedAt: new Date(), pinnedExpiresAt: expiresAt },
      })
      await tx.storePurchase.update({
        where: { id: purchase.id },
        data: { status: 'USED', usedAt: new Date(), expiresAt, targetType: 'TRACK_COMMENT', targetId },
      })
    } else if (purchase.storeItem.key === 'PIN_FEED_POST') {
      const post = await tx.post.findUnique({ where: { id: targetId } })
      if (!post || post.authorId !== userId) {
        throw new StoreError('INVALID_TARGET', 'Post não encontrado ou não é seu')
      }

      const concurrent = await tx.post.count({ where: { pinnedExpiresAt: { gt: new Date() } } })
      if (purchase.storeItem.maxConcurrent && concurrent >= purchase.storeItem.maxConcurrent) {
        throw new StoreError('SLOTS_FULL', 'Todas as vagas de fixação no feed estão ocupadas agora')
      }

      await tx.post.update({
        where: { id: targetId },
        data: { pinned: true, pinnedAt: new Date(), pinnedExpiresAt: expiresAt },
      })
      await tx.storePurchase.update({
        where: { id: purchase.id },
        data: { status: 'USED', usedAt: new Date(), expiresAt, targetType: 'POST', targetId },
      })
    } else {
      throw new StoreError('NOT_USABLE', 'Este item não precisa ser "usado" — já foi aplicado na compra')
    }

    return tx.storePurchase.findUniqueOrThrow({ where: { id: purchase.id } })
  })
}

/**
 * Presente do admin — pula cobrança de pontos e os limites de venda/slot
 * (são vagas vendidas, não doadas). Itens de efeito imediato já aplicam
 * na hora; itens de slot ficam AWAITING_USE igual a uma compra normal.
 */
export async function giftItem(
  adminUserId: string,
  targetUserId: string,
  itemKey: StoreItemKey,
  opts?: { referEmail?: string }
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: targetUserId } })
    const item = await tx.storeItem.findUnique({ where: { key: itemKey } })
    if (!item) throw new StoreError('ITEM_NOT_FOUND', 'Item não encontrado')

    const now = new Date()
    let status: StorePurchaseStatus = 'AWAITING_USE'
    const usableUntil: Date | null = item.durationHours ? hoursFromNow(item.durationHours) : null
    let usedAt: Date | null = null
    let expiresAt: Date | null = null
    let targetType: string | null = null
    let targetId: string | null = null

    switch (item.key) {
      case 'PRIORITY_INVITE': {
        if (!opts?.referEmail) throw new StoreError('MISSING_EMAIL', 'Email de quem indicar é obrigatório')
        const email = opts.referEmail.trim().toLowerCase()
        const existing = await tx.waitlist.findUnique({ where: { email } })
        if (existing) {
          await tx.waitlist.update({ where: { email }, data: { referredByUserId: targetUserId, priority: true } })
        } else {
          await tx.waitlist.create({
            data: { email, tipoUsuario: 'OUTRO', consentedAt: now, referredByUserId: targetUserId, priority: true },
          })
        }
        status = 'USED'
        usedAt = now
        targetType = 'WAITLIST_EMAIL'
        targetId = email
        break
      }
      case 'EXTRA_STORAGE':
        await tx.user.update({ where: { id: targetUserId }, data: { bonusStorageMb: { increment: 200 } } })
        status = 'USED'
        usedAt = now
        break
      case 'MAPPING_ACCESS': {
        const base = user.mappingExpiresAt && user.mappingExpiresAt > now ? user.mappingExpiresAt : now
        const newExpiry = new Date(base.getTime() + (item.durationHours ?? 0) * 60 * 60 * 1000)
        await tx.user.update({ where: { id: targetUserId }, data: { mappingExpiresAt: newExpiry } })
        status = 'USED'
        usedAt = now
        expiresAt = newExpiry
        break
      }
      case 'APP_PREMIUM': {
        const base = user.appPremiumExpiresAt && user.appPremiumExpiresAt > now ? user.appPremiumExpiresAt : now
        const newExpiry = new Date(base.getTime() + (item.durationHours ?? 0) * 60 * 60 * 1000)
        await tx.user.update({ where: { id: targetUserId }, data: { appPremiumExpiresAt: newExpiry } })
        status = 'USED'
        usedAt = now
        expiresAt = newExpiry
        break
      }
      default:
        status = 'AWAITING_USE'
    }

    return tx.storePurchase.create({
      data: {
        userId: targetUserId,
        storeItemId: item.id,
        pricePaid: 0,
        status,
        targetType,
        targetId,
        usableUntil,
        usedAt,
        expiresAt,
        isGift: true,
        giftedByAdminId: adminUserId,
      },
    })
  })
}
