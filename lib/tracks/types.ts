// ============================================================
// Tipos públicos — o que o frontend recebe das API routes
// Nunca expõem audioKey, coverKey nem campos internos
// ============================================================

export interface ArtistPublic {
  id: string
  slug: string
  name: string
  bio: string | null
  photoUrl: string | null
  userHandle: string | null
  /** V3 Plano 12 — id do usuário dono da faixa (para o follow-gate de download).
   *  null quando o artista não está ligado a uma conta. */
  userId: string | null
}

export interface TrackPublic {
  id: string
  slug: string
  title: string
  description: string | null
  genre: string | null
  bpm: number | null
  key: string | null
  mood: string | null
  tags: string[]
  /** V3 Plano 11 — necessário para decidir se a faixa é elegível a "retomar" */
  durationSeconds: number | null
  /** V3 Plano 14 — série a que a faixa pertence (null = sem série) + nº do episódio */
  seriesId: string | null
  episodeNumber: number | null
  /** V3 Plano 16 — "track" | "set" | "podcast" (ver lib/tracks/track-kinds.ts) */
  kind: string
  /** V3 Plano 12 — "free" (qualquer conta baixa) | "follow" (exige seguir o dono) */
  downloadMode: string
  producerName: string | null
  coverUrl: string | null
  audioFormat: string
  audioSizeBytes: string | null // BigInt serializado como string
  downloadCount: number
  likeCount: number
  repostCount: number
  /** V3 Plano 15 — emoji de reação mais usado na faixa (null = sem reações) */
  topReaction: string | null
  /** Contagem SÓ do emoji top (o card mostra "🔥 <topReactionCount>") */
  topReactionCount: number
  /** Total de todas as reações somadas (todos os emojis) */
  reactionCount: number
  publishedAt: string | null    // ISO string
  pinned: boolean
  artist: ArtistPublic
}

export interface TrackListResponse {
  tracks: TrackPublic[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}

export interface TrackDetailResponse {
  track: TrackPublic
}
