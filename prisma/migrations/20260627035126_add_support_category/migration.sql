-- CreateEnum
CREATE TYPE "SupportCategory" AS ENUM ('BUG', 'SUGESTAO', 'DUVIDA', 'OUTRO');

-- AlterTable
ALTER TABLE "support_tickets" ADD COLUMN     "category" "SupportCategory" NOT NULL DEFAULT 'OUTRO';
