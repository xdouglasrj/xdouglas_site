export interface PublicUser {
  id: string
  handle: string
  displayName: string
  photoUrl: string | null
  role: string
  isArtist: boolean
}

const ARTIST_ROLES = ['ARTIST', 'ARTIST_SUPPORTER']

export const PUBLIC_USER_SELECT = {
  id: true,
  handle: true,
  name: true,
  artisticName: true,
  photoUrl: true,
  role: true,
  showName: true,
} as const

interface RawPublicUser {
  id: string
  handle: string | null
  name: string | null
  artisticName: string | null
  photoUrl: string | null
  role: string
  showName: boolean
}

/** Mapeia um User do banco para o formato público — respeita showName. */
export function toPublicUser(u: RawPublicUser): PublicUser {
  const isArtist = ARTIST_ROLES.includes(u.role)
  const canShowName = !isArtist || u.showName
  const displayName = (canShowName ? u.name || u.artisticName : u.artisticName) || u.handle!
  return {
    id: u.id,
    handle: u.handle!,
    displayName,
    photoUrl: u.photoUrl,
    role: u.role,
    isArtist,
  }
}
