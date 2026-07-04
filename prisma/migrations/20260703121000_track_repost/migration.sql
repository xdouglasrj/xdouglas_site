-- V3 Plano 3 — repostar música no perfil (estilo Audius).
-- Migration ADITIVA: tabela nova + valor novo de enum.

-- AlterEnum: ponto por repost recebido pelo artista
-- (PostgreSQL 12+ aceita ADD VALUE em transação; IF NOT EXISTS torna idempotente)
ALTER TYPE "PointActionType" ADD VALUE IF NOT EXISTS 'REPOST_RECEIVED';

-- CreateTable
CREATE TABLE "track_reposts" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_reposts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "track_reposts_track_id_user_id_key" ON "track_reposts"("track_id", "user_id");
CREATE INDEX "track_reposts_user_id_idx" ON "track_reposts"("user_id");

-- AddForeignKey
ALTER TABLE "track_reposts" ADD CONSTRAINT "track_reposts_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "track_reposts" ADD CONSTRAINT "track_reposts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
