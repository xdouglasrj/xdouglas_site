-- V3 Plano 5 — metadados DJ: mood, tags e duração da faixa.
-- Migration ADITIVA (colunas anuláveis/default), segura para migrate deploy.

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN "mood" TEXT;
ALTER TABLE "tracks" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "tracks" ADD COLUMN "duration_seconds" INTEGER;

-- CreateIndex
CREATE INDEX "tracks_mood_idx" ON "tracks"("mood");
