-- V3 Plano 16 — tipo de upload (Música / Set-Mix / Podcast)
-- Aditivo: default "track" preserva todas as faixas existentes.
ALTER TABLE "tracks" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'track';

-- CreateIndex
CREATE INDEX "tracks_kind_idx" ON "tracks"("kind");
