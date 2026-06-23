import { prisma } from '@/lib/prisma'

const SINGLETON_ID = 'singleton'

export interface AutoAcceptSettings {
  enabled: boolean
  remaining: number
}

/** Lê o estado atual do aceite automático. */
export async function getAutoAcceptSettings(): Promise<AutoAcceptSettings> {
  const s = await prisma.appSettings.findUnique({ where: { id: SINGLETON_ID } })
  return {
    enabled: s?.autoAcceptEnabled ?? false,
    remaining: s?.autoAcceptRemaining ?? 0,
  }
}

/**
 * Liga/desliga o aceite automático. Ao ligar, define o limite (quantos
 * convites serão aceitos sozinhos). Liga só se o limite for > 0.
 */
export async function setAutoAccept(enabled: boolean, limit: number): Promise<AutoAcceptSettings> {
  const remaining = enabled ? Math.max(0, Math.floor(limit)) : 0
  const finalEnabled = enabled && remaining > 0

  const s = await prisma.appSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, autoAcceptEnabled: finalEnabled, autoAcceptRemaining: remaining },
    update: { autoAcceptEnabled: finalEnabled, autoAcceptRemaining: remaining },
  })

  return { enabled: s.autoAcceptEnabled, remaining: s.autoAcceptRemaining }
}

/**
 * Consome 1 vaga do aceite automático de forma atômica (evita corrida
 * entre pedidos simultâneos). Retorna true se havia vaga — ou seja, o
 * pedido deve ser aceito automaticamente. Ao zerar, desliga sozinho.
 */
export async function consumeAutoAcceptSlot(): Promise<boolean> {
  // Decremento condicional atômico: só desce se ligado e com saldo > 0
  const dec = await prisma.appSettings.updateMany({
    where: { id: SINGLETON_ID, autoAcceptEnabled: true, autoAcceptRemaining: { gt: 0 } },
    data: { autoAcceptRemaining: { decrement: 1 } },
  })

  if (dec.count === 0) return false

  // Se chegou a zero, desliga o piloto automático
  await prisma.appSettings.updateMany({
    where: { id: SINGLETON_ID, autoAcceptRemaining: { lte: 0 } },
    data: { autoAcceptEnabled: false },
  })

  return true
}
