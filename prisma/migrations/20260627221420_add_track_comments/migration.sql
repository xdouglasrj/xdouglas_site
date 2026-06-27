-- CreateTable
CREATE TABLE "track_comments" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "track_comments_track_id_idx" ON "track_comments"("track_id");

-- AddForeignKey
ALTER TABLE "track_comments" ADD CONSTRAINT "track_comments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_comments" ADD CONSTRAINT "track_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
