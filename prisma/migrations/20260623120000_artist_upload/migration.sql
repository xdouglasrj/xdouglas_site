ALTER TABLE "artists" ADD COLUMN "user_id" TEXT;
CREATE UNIQUE INDEX "artists_user_id_key" ON "artists"("user_id");
ALTER TABLE "artists" ADD CONSTRAINT "artists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tracks" ADD COLUMN "submitted_by_id" TEXT;
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "tracks_submitted_by_id_idx" ON "tracks"("submitted_by_id");
