// ============================================================
// V3 Plano 15 — conjunto FIXO de emojis de reação nas faixas.
// Não aceitar emoji livre: sempre validar contra REACTION_EMOJIS
// no servidor antes de gravar no banco.
// ============================================================

export const REACTION_EMOJIS = ['🔥', '❤️', '🕺', '😮', '😂', '🥶'] as const

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

export function isReactionEmoji(value: string): value is ReactionEmoji {
  return (REACTION_EMOJIS as readonly string[]).includes(value)
}
