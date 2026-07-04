-- V3 Plano 11 — retomar de onde parou (resume playback).
-- Migration ADITIVA: tabela nova, sem alterar nada existente.

-- CreateTable
CREATE TABLE "playback_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "position_seconds" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playback_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "playback_progress_user_id_track_id_key" ON "playback_progress"("user_id", "track_id");
CREATE INDEX "playback_progress_track_id_idx" ON "playback_progress"("track_id");
CREATE INDEX "playback_progress_updated_at_idx" ON "playback_progress"("updated_at");

-- AddForeignKey
ALTER TABLE "playback_progress" ADD CONSTRAINT "playback_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "playback_progress" ADD CONSTRAINT "playback_progress_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
