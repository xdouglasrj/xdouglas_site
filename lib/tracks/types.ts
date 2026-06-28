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
}

export interface TrackPublic {
  id: string
  slug: string
  title: string
  description: string | null
  genre: string | null
  bpm: number | null
  key: string | null
  producerName: string | null
  coverUrl: string | null
  audioFormat: string
  audioSizeBytes: string | null // BigInt serializado como string
  downloadCount: number
  likeCount: number
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
