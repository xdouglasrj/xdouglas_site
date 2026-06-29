-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "scheduling_token" TEXT;

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "scheduled_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "artists_scheduling_token_key" ON "artists"("scheduling_token");

-- CreateIndex
CREATE INDEX "tracks_scheduled_at_idx" ON "tracks"("scheduled_at");

