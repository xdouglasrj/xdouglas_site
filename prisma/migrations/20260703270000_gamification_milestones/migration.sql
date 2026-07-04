-- V3 Plano 7 — Gamificação: marcos idempotentes (plays de faixa, 1º
-- comentário da semana, 1ª playlist, 1ª curtida dada). Streak de login já
-- existe (User.loginStreak / lastDailyLoginAt) — nenhuma alteração nele.

-- AlterEnum
ALTER TYPE "PointActionType" ADD VALUE 'TRACK_MILESTONE_250';
ALTER TYPE "PointActionType" ADD VALUE 'TRACK_MILESTONE_10000';
ALTER TYPE "PointActionType" ADD VALUE 'FIRST_COMMENT_OF_WEEK';
ALTER TYPE "PointActionType" ADD VALUE 'FIRST_PLAYLIST_CREATED';
ALTER TYPE "PointActionType" ADD VALUE 'FIRST_LIKE_GIVEN';

-- CreateTable
-- ref_id é NOT NULL DEFAULT '' de propósito: Postgres trata NULL como
-- distinto em unique constraints, o que quebraria a idempotência dos
-- marcos "paga 1x na vida" (refId vazio) se a coluna aceitasse NULL.
CREATE TABLE "milestone_awards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ref_id" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_awards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "milestone_awards_user_id_idx" ON "milestone_awards"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_awards_user_id_kind_ref_id_key" ON "milestone_awards"("user_id", "kind", "ref_id");

-- AddForeignKey
ALTER TABLE "milestone_awards" ADD CONSTRAINT "milestone_awards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
