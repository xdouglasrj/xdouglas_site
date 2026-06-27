import { prisma } from '@/lib/prisma'

const SINGLETON_ID = 'singleton'

/** Chave do storage da vinheta tocada dinamicamente pelo player (null = nenhuma). */
export async function getVinhetaKey(): Promise<string | null> {
  const s = await prisma.appSettings.findUnique({ where: { id: SINGLETON_ID } })
  return s?.vinhetaKey ?? null
}

/** Define (ou remove, passando null) a vinheta tocada ao fim de cada faixa no player. */
export async function setVinhetaKey(key: string | null): Promise<string | null> {
  const s = await prisma.appSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, vinhetaKey: key },
    update: { vinhetaKey: key },
  })
  return s.vinhetaKey
}

/** Chave do storage da vinheta colada no arquivo de download (null = sem vinheta no download). */
export async function getVinhetaDownloadKey(): Promise<string | null> {
  const s = await prisma.appSettings.findUnique({ where: { id: SINGLETON_ID } })
  return s?.vinhetaDownloadKey ?? null
}

/** Define (ou remove, passando null) a vinheta colada no arquivo entregue no download. */
export async function setVinhetaDownloadKey(key: string | null): Promise<string | null> {
  const s = await prisma.appSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, vinhetaDownloadKey: key },
    update: { vinhetaDownloadKey: key },
  })
  return s.vinhetaDownloadKey
}
