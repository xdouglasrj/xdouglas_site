import type { UserPlan } from '@prisma/client'

// Cota de armazenamento por plano (em MB) — soma de audioSizeBytes das
// músicas que o próprio usuário enviou (Track.submittedById).
export const PLAN_QUOTA_MB: Record<UserPlan, number> = {
  FREE: 200,
  PAID: 1024,
}

export function getPlanQuotaBytes(plan: UserPlan): number {
  return PLAN_QUOTA_MB[plan] * 1024 * 1024
}
