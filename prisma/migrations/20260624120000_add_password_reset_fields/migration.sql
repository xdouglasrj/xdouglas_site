-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_COMPLETED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "reset_password_token_hash" TEXT;
ALTER TABLE "users" ADD COLUMN "reset_password_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_password_token_hash_key" ON "users"("reset_password_token_hash");
