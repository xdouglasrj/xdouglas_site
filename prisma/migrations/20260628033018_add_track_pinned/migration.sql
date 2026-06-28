-- AlterTable
ALTER TABLE "track_comments" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinned_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinned_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "track_comments_pinned_idx" ON "track_comments"("pinned");

-- CreateIndex
CREATE INDEX "tracks_pinned_idx" ON "tracks"("pinned");
