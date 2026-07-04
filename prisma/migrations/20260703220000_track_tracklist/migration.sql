-- V3 Plano 10 — tracklist com timestamps (aditiva)
-- CreateTable
CREATE TABLE "track_tracklist_items" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "start_seconds" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "track_tracklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "track_tracklist_items_track_id_idx" ON "track_tracklist_items"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "track_tracklist_items_track_id_position_key" ON "track_tracklist_items"("track_id", "position");

-- AddForeignKey
ALTER TABLE "track_tracklist_items" ADD CONSTRAINT "track_tracklist_items_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
