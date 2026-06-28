// Mesma nomenclatura pros dois tipos de usuário (artista/ouvinte) por
// enquanto — pode divergir no futuro sem mudar a faixa de XP.
export const LEVELS = [
  { level: 1, name: 'Descobridor', minXp: 0 },
  { level: 2, name: 'Explorador', minXp: 15_001 },
  { level: 3, name: 'Influenciador', minXp: 50_001 },
  { level: 4, name: 'Lenda Musical', minXp: 500_001 },
] as const

export function getLevelForXp(totalXp: number): number {
  let level: number = LEVELS[0].level
  for (const l of LEVELS) {
    if (totalXp >= l.minXp) level = l.level
  }
  return level
}

export function getLevelName(level: number): string {
  return LEVELS.find((l) => l.level === level)?.name ?? LEVELS[0].name
}
