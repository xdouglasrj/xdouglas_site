// Lista canônica de gêneros aceitos no catálogo. Usada tanto nos formulários
// de upload (pra evitar texto livre divergente) quanto no filtro da sidebar —
// uma única fonte de verdade, já que o filtro de gênero faz match exato.
export const TRACK_GENRES = [
  'Eletrônico',
  'Funk',
  'Pagode',
  'Rap/Trap',
  'Remix',
  'Sertanejo',
] as const

export type TrackGenre = (typeof TRACK_GENRES)[number]
