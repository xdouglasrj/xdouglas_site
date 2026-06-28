-- DropForeignKey
ALTER TABLE "downloads" DROP CONSTRAINT "downloads_track_id_fkey";

-- DropForeignKey
ALTER TABLE "track_comments" DROP CONSTRAINT "track_comments_track_id_fkey";

-- DropForeignKey
ALTER TABLE "track_likes" DROP CONSTRAINT "track_likes_track_id_fkey";

-- AddForeignKey
ALTER TABLE "track_comments" ADD CONSTRAINT "track_comments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_likes" ADD CONSTRAINT "track_likes_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
