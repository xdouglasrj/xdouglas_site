import { Prisma, Role, StoreAudience } from '@prisma/client'

type Tx = Prisma.TransactionClient

const SETTINGS_ID = 'singleton'

function audienceGroupForRole(role: Role): StoreAudience | null {
  if (role === 'ADMIN') return null
  return role === 'ARTIST' ? 'ARTIST' : 'LISTENER'
}

/**
 * Mercado de preço dinâmico — chamado de dentro da transação de addPoints
 * sempre que o XP de alguém sobe. Se o usuário acabou de cruzar (por
 * marco PERMANENTE, não saldo atual) o preço do item mais caro da sua
 * loja (artista ou ouvinte), registra o marco; quando N pessoas
 * cruzarem dentro da janela configurada, todos os itens dessa audiência
 * sobem de preço juntos — o contador reinicia sozinho porque o novo
 * preço gera marcos com priceAtReach diferente.
 */
export async function checkDynamicPricing(tx: Tx, userId: string, role: Role, totalXp: number): Promise<void> {
  const group = audienceGroupForRole(role)
  if (!group) return

  const topItem = await tx.storeItem.findFirst({
    where: { active: true, audience: { in: [group, 'BOTH'] } },
    orderBy: { price: 'desc' },
  })
  if (!topItem || totalXp < topItem.price) return

  // Marco permanente — unique(userId, storeItemId, priceAtReach) garante
  // que só conta 1x por usuário, por item, por valor de preço
  let isNewMilestone = true
  try {
    await tx.storeThresholdEvent.create({
      data: { userId, storeItemId: topItem.id, priceAtReach: topItem.price },
    })
  } catch {
    isNewMilestone = false // já tinha cruzado esse preço antes
  }
  if (!isNewMilestone) return

  const settings = await tx.appSettings.findUnique({ where: { id: SETTINGS_ID } })
  const thresholdCount = settings?.storeDynamicPriceThresholdCount ?? 3
  const windowHours = settings?.storeDynamicPriceWindowHours ?? 720
  const increasePercent = settings?.storeDynamicPriceIncreasePercent ?? 20

  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000)
  const countInWindow = await tx.storeThresholdEvent.count({
    where: { storeItemId: topItem.id, reachedAt: { gte: windowStart } },
  })

  if (countInWindow < thresholdCount) return

  const groupItems = await tx.storeItem.findMany({
    where: { active: true, audience: { in: [group, 'BOTH'] } },
  })

  for (const item of groupItems) {
    const newPrice = Math.round(item.price * (1 + increasePercent / 100))
    await tx.storeItem.update({ where: { id: item.id }, data: { price: newPrice } })
    await tx.storePriceAdjustment.create({
      data: {
        storeItemId: item.id,
        oldPrice: item.price,
        newPrice,
        triggeredByCount: countInWindow,
        windowStart,
        windowEnd: new Date(),
      },
    })
  }
}
