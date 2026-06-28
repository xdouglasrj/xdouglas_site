import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { createCheckoutLink, checkPayment, InfinitePayError } from './infinitepay'
import { EXTRA_STORAGE_PRICE_CENTS, EXTRA_STORAGE_BONUS_MB, EXTRA_STORAGE_PRODUCT_KEY } from './storage-product'

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

// Cria o pedido (PENDING) e o link de checkout InfinitePay pro +1GB pago em
// dinheiro — produto separado do item "Armazenamento extra" da loja de pontos.
export async function createStorageCheckout(userId: string): Promise<{ url: string }> {
  const orderNsu = randomUUID()

  await prisma.paymentOrder.create({
    data: {
      userId,
      orderNsu,
      product: EXTRA_STORAGE_PRODUCT_KEY,
      amountCents: EXTRA_STORAGE_PRICE_CENTS,
    },
  })

  const { url } = await createCheckoutLink({
    orderNsu,
    items: [{ quantity: 1, price: EXTRA_STORAGE_PRICE_CENTS, description: '+1GB de armazenamento xDouglas' }],
    redirectUrl: `${appUrl()}/loja?order_nsu=${orderNsu}`,
    webhookUrl: `${appUrl()}/api/webhooks/infinitepay`,
  })

  await prisma.paymentOrder.update({ where: { orderNsu }, data: { checkoutUrl: url } })

  return { url }
}

/**
 * Confirma e libera o efeito de um pedido — chamada tanto pelo webhook
 * quanto pela página de retorno (polling). Sempre reverifica direto na
 * InfinitePay (nunca confia só no payload recebido) e usa updateMany com
 * status: 'PENDING' como trava de corrida: só uma chamada concorrente
 * consegue transicionar o pedido, então o bônus nunca é dado em dobro.
 */
export async function confirmStoragePayment(params: {
  orderNsu: string
  transactionNsu: string
  invoiceSlug: string
}): Promise<{ alreadyProcessed: boolean; paid: boolean }> {
  const order = await prisma.paymentOrder.findUnique({ where: { orderNsu: params.orderNsu } })
  if (!order) throw new InfinitePayError(`Pedido não encontrado: ${params.orderNsu}`)

  if (order.status !== 'PENDING') {
    return { alreadyProcessed: true, paid: order.status === 'PAID' }
  }

  const check = await checkPayment({
    orderNsu: params.orderNsu,
    transactionNsu: params.transactionNsu,
    slug: params.invoiceSlug,
  })

  if (!check.success || !check.paid || check.paidAmount < order.amountCents) {
    return { alreadyProcessed: false, paid: false }
  }

  const { count } = await prisma.paymentOrder.updateMany({
    where: { orderNsu: params.orderNsu, status: 'PENDING' },
    data: {
      status: 'PAID',
      transactionNsu: params.transactionNsu,
      invoiceSlug: params.invoiceSlug,
      captureMethod: check.captureMethod,
      paidAmountCents: check.paidAmount,
      paidAt: new Date(),
    },
  })

  if (count === 1 && order.product === EXTRA_STORAGE_PRODUCT_KEY) {
    await prisma.user.update({
      where: { id: order.userId },
      data: { bonusStorageMb: { increment: EXTRA_STORAGE_BONUS_MB } },
    })
  }

  return { alreadyProcessed: false, paid: true }
}
