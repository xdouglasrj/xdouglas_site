-- V3 Plano 17 — histórico de escuta (privado, só o dono vê).
-- Migration ADITIVA: tabela nova, sem alterar nada existente.

-- CreateTable
CREATE TABLE "listening_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listening_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listening_history_user_id_track_id_key" ON "listening_history"("user_id", "track_id");
CREATE INDEX "listening_history_user_id_played_at_idx" ON "listening_history"("user_id", "played_at");

-- AddForeignKey
ALTER TABLE "listening_history" ADD CONSTRAINT "listening_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "listening_history" ADD CONSTRAINT "listening_history_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
