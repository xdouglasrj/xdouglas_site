-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT,
ADD COLUMN "newsletter_opt_in" BOOLEAN NOT NULL DEFAULT false;
