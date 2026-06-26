-- CreateTable
CREATE TABLE "track_likes" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "track_likes_track_id_idx" ON "track_likes"("track_id");

-- CreateIndex
CREATE INDEX "track_likes_user_id_idx" ON "track_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "track_likes_track_id_user_id_key" ON "track_likes"("track_id", "user_id");

-- AddForeignKey
ALTER TABLE "track_likes" ADD CONSTRAINT "track_likes_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_likes" ADD CONSTRAINT "track_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
