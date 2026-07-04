import { prisma } from '@/lib/prisma'
import { parseTracklist } from './tracklist'

// ============================================================
// Persistência da tracklist (V3 Plano 10) — server-only (importa Prisma).
// Regra de escrita: substitui totalmente a tracklist da faixa a partir do
// texto colado no formulário. `undefined` = campo não enviado (não mexe);
// string vazia/null = limpar a tracklist. Erro de parse não bloqueia o
// upload — linhas inválidas são simplesmente ignoradas pelo parser.
// ============================================================

export async function saveTracklistFromText(
  trackId: string,
  text: string | null | undefined,
): Promise<void> {
  if (text === undefined) return

  const items = text ? parseTracklist(text).items : []

  await prisma.$transaction([
    prisma.trackTracklistItem.deleteMany({ where: { trackId } }),
    ...(items.length > 0
      ? [
          prisma.trackTracklistItem.createMany({
            data: items.map((i) => ({
              trackId,
              position: i.position,
              startSeconds: i.startSeconds,
              title: i.title,
            })),
          }),
        ]
      : []),
  ])
}

export interface TracklistItemPublic {
  position: number
  startSeconds: number
  title: string
}

/** Itens da tracklist de uma faixa, ordenados (público — só texto). */
export async function getTrackTracklist(trackId: string): Promise<TracklistItemPublic[]> {
  return prisma.trackTracklistItem.findMany({
    where: { trackId },
    orderBy: { position: 'asc' },
    select: { position: true, startSeconds: true, title: true },
  })
}
