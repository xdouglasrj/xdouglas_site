-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'PAID');

-- AlterTable: cota de armazenamento por usuário
ALTER TABLE "users" ADD COLUMN "plan" "UserPlan" NOT NULL DEFAULT 'FREE';

-- AlterTable: novo padrão de limite de upload de música (era 20MB)
ALTER TABLE "app_settings" ALTER COLUMN "music_max_size_mb" SET DEFAULT 10;

-- DataMigration: aplica o novo teto de 10MB também na configuração já salva
UPDATE "app_settings" SET "music_max_size_mb" = 10 WHERE "music_max_size_mb" > 10;
