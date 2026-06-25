-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "music_max_size_mb" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "podcast_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podcast_max_size_mb" INTEGER NOT NULL DEFAULT 100,
ALTER COLUMN "id" SET DEFAULT 'singleton',
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "show_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_phone" BOOLEAN NOT NULL DEFAULT false;
