-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "vinheta_download_key" TEXT;

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "download_audio_key" TEXT,
ADD COLUMN     "download_audio_vinheta_key" TEXT;
