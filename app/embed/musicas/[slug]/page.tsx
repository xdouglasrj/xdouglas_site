import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTrackBySlug } from '@/lib/tracks/queries'
import { EmbedPlayer } from './embed-player'

// ============================================================
// V3 Plano 8 — Player embedável (iframe)
//
// Rota pública e mínima (sem IconSidebar/PublicHeader/GlobalPlayerBar):
// mini-player com capa, título/artista, play/pause e barra de progresso,
// pensado para ser renderizado dentro de um <iframe> em outro site.
//
// Áudio próprio e ISOLADO — não usa o PlayerProvider global (evita que
// o embed controle/seja controlado pelo player principal do site).
// Busca a URL assinada via o mesmo /api/stream público (30min TTL,
// nunca expõe a audioKey), então toca sem exigir login.
// ============================================================

export const revalidate = 120

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const track = await getTrackBySlug(slug)

  if (!track) return { title: 'Música não encontrada' }

  return {
    title: `${track.title} — ${track.artist.name}`,
    robots: { index: false, follow: false },
  }
}

export default async function EmbedTrackPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const track = await getTrackBySlug(slug)

  if (!track) notFound()

  return (
    <EmbedPlayer
      trackId={track.id}
      slug={track.slug}
      title={track.title}
      artistName={track.artist.name}
      artistSlug={track.artist.slug}
      coverUrl={track.coverUrl}
    />
  )
}
