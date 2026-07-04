-- V3 Plano 18 — Eventos / agenda de apresentações (ADITIVA)
-- Cria tabela artist_events. Nenhuma coluna existente é alterada.

CREATE TABLE "artist_events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "venue" TEXT,
    "city" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "info_url" TEXT,
    "cover_key" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artist_events_slug_key" ON "artist_events"("slug");

CREATE INDEX "artist_events_artist_id_starts_at_idx" ON "artist_events"("artist_id", "starts_at");

ALTER TABLE "artist_events" ADD CONSTRAINT "artist_events_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
