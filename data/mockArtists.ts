export interface MockArtist {
  id: string
  slug: string
  name: string
  genre: string
  location: string
  followers: number
  description: string
  tracks: number
}

export const mockArtists: MockArtist[] = [
  {
    id: '1',
    slug: 'nova-pulse',
    name: 'Nova Pulse',
    genre: 'Electronic / House',
    location: 'Rio de Janeiro, RJ',
    followers: 4821,
    description: 'Producer e DJ carioca formado em produção musical. Referência em deep house com influências de música afro-brasileira.',
    tracks: 34,
  },
  {
    id: '2',
    slug: 'drift-kr',
    name: 'Drift KR',
    genre: 'Trap / Hip-Hop',
    location: 'São Paulo, SP',
    followers: 7340,
    description: 'Beatmaker paulistano com foco em trap experimental. Colaborações com MCs de todo o Brasil e produção para o mercado independente.',
    tracks: 58,
  },
  {
    id: '3',
    slug: 'cena-b',
    name: 'Cena B',
    genre: 'Afrobeats / R&B',
    location: 'Salvador, BA',
    followers: 3190,
    description: 'Artista e produtor baiano que mistura afrobeats contemporâneo com elementos do samba e axé. Voz e produção própria.',
    tracks: 21,
  },
]
