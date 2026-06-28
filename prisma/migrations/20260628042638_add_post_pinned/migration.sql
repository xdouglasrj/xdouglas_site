-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinned_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "posts_pinned_idx" ON "posts"("pinned");
