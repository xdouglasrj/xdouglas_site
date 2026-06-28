-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinned_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "comments_pinned_idx" ON "comments"("pinned");
