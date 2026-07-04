-- V3 Plano 20 — Verificação de copyright no upload (AcoustID)
-- Migration aditiva: colunas novas em "tracks" com default seguro.
-- copyright_status: "pending" | "clear" | "match" | "error" | "skipped"
-- copyright_result: resumo do match (score, recordingId, title, artist) —
--   só preenchido quando copyright_status = "match"
-- copyright_at: quando a última verificação rodou

ALTER TABLE "tracks" ADD COLUMN "copyright_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "tracks" ADD COLUMN "copyright_result" JSONB;
ALTER TABLE "tracks" ADD COLUMN "copyright_at" TIMESTAMP(3);
