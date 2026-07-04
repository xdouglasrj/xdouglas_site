-- V3 Plano 9 — Completude de perfil
-- Migration ADITIVA: só adiciona colunas nullable/opcionais e um novo valor
-- de enum. Não altera nem remove nada existente.

-- AlterEnum
ALTER TYPE "PointActionType" ADD VALUE 'PROFILE_100_PERCENT';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "cover_key" TEXT,
ADD COLUMN     "cover_url" TEXT,
ADD COLUMN     "instagram_url" TEXT,
ADD COLUMN     "youtube_url" TEXT,
ADD COLUMN     "tiktok_url" TEXT,
ADD COLUMN     "website_url" TEXT,
ADD COLUMN     "profile_reminder_sent_at" TIMESTAMP(3);
