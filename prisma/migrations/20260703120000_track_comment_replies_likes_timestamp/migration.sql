-- V3 Plano 2 — comentários com timestamp, respostas (1 nível) e likes.
-- Migration ADITIVA: só adiciona colunas anuláveis e uma tabela nova,
-- segura para `prisma migrate deploy` no build da Vercel.

-- AlterTable: respostas + timestamp da música
ALTER TABLE "track_comments" ADD COLUMN "parent_id" TEXT;
ALTER TABLE "track_comments" ADD COLUMN "timestamp_seconds" INTEGER;

-- CreateTable: likes de comentário
CREATE TABLE "track_comment_likes" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "track_comments_parent_id_idx" ON "track_comments"("parent_id");
CREATE UNIQUE INDEX "track_comment_likes_comment_id_user_id_key" ON "track_comment_likes"("comment_id", "user_id");
CREATE INDEX "track_comment_likes_comment_id_idx" ON "track_comment_likes"("comment_id");

-- AddForeignKey
ALTER TABLE "track_comments" ADD CONSTRAINT "track_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "track_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "track_comment_likes" ADD CONSTRAINT "track_comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "track_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "track_comment_likes" ADD CONSTRAINT "track_comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
