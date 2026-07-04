-- V3 Plano 12 — "Seguir para baixar" (follow-gate no download)
-- Aditivo: default "free" preserva o comportamento atual de todas as faixas.
ALTER TABLE "tracks" ADD COLUMN "download_mode" TEXT NOT NULL DEFAULT 'free';

-- Métrica de conversão do follow-gate: "direct" (botão normal) ou
-- "follow_gate" (baixou logo após seguir o artista). Aditivo, sem backfill.
ALTER TABLE "downloads" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'direct';
