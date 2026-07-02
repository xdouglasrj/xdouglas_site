// Lista canônica de gêneros aceitos no catálogo. Usada tanto nos formulários
// de upload (pra evitar texto livre divergente) quanto no filtro da sidebar —
// uma única fonte de verdade, já que o filtro de gênero faz match exato.
export const TRACK_GENRES = [
  'Eletrônico',
  'Funk',
  'Gospel',
  'Pagode',
  'Rap/Trap',
  'Remix',
  'Sertanejo',
] as const

export type TrackGenre = (typeof TRACK_GENRES)[number]

// Slug amigável de URL para cada gênero (usado em /generos/[genero], SEO —
// ver §3.4 do MAPA-E-PLANO-XDOUGLAS.md). Match exato com o campo
// `Track.genre` (string), não com a tabela hierárquica `Genre` (ainda não
// é a fonte operante do filtro de catálogo).
export function genreToSlug(genre: string): string {
  return genre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\//g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function genreFromSlug(slug: string): TrackGenre | null {
  return TRACK_GENRES.find((g) => genreToSlug(g) === slug) ?? null
}
