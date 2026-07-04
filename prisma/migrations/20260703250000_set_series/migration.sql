-- V3 Plano 14 — Séries de sets (volumes/episódios)
-- Migration ADITIVA: cria track_series e adiciona series_id/episode_number em tracks.

-- CreateTable
CREATE TABLE "track_series" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_key" TEXT,
    "artist_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "track_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "track_series_slug_key" ON "track_series"("slug");

-- CreateIndex
CREATE INDEX "track_series_artist_id_idx" ON "track_series"("artist_id");

-- CreateIndex (V3 Plano 14 — evita séries duplicadas com mesmo título por artista)
CREATE UNIQUE INDEX "track_series_artist_id_title_key" ON "track_series"("artist_id", "title");

-- AddForeignKey
ALTER TABLE "track_series" ADD CONSTRAINT "track_series_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN "series_id" TEXT,
ADD COLUMN "episode_number" INTEGER;

-- CreateIndex
CREATE INDEX "tracks_series_id_idx" ON "tracks"("series_id");

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "track_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
