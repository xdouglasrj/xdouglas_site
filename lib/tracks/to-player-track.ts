import type { TrackPublic } from '@/lib/tracks/types'
import type { PlayerTrack } from '@/components/player/player-provider'

/**
 * Mapeia uma faixa pública para o formato mínimo que o player consome.
 *
 * Fica num módulo puro (sem "use client") para poder ser chamado tanto em
 * Server Components (montar a fila de reprodução no servidor) quanto em Client
 * Components. Uma função exportada de um módulo "use client" vira referência de
 * cliente e não pode ser invocada no servidor.
 */
export function toPlayerTrack(track: TrackPublic): PlayerTrack {
  return {
    id: track.id,
    slug: track.slug,
    title: track.title,
    artistName: track.artist.name,
    coverUrl: track.coverUrl,
  }
}
