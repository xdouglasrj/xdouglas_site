-- V3 Plano 15 — reações com emoji nas faixas (camada expressiva ADICIONAL ao
-- TrackLike; não vale ponto, não influencia trending). 1 reação por usuário
-- por faixa — trocar de emoji substitui a anterior via @@unique.

-- CreateTable
CREATE TABLE "track_reactions" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "track_reactions_track_id_idx" ON "track_reactions"("track_id");

-- CreateIndex
CREATE INDEX "track_reactions_user_id_idx" ON "track_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "track_reactions_track_id_user_id_key" ON "track_reactions"("track_id", "user_id");

-- AddForeignKey
ALTER TABLE "track_reactions" ADD CONSTRAINT "track_reactions_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_reactions" ADD CONSTRAINT "track_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
