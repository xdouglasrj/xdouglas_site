-- V3 Plano 13 — Destaque de faixa gastando pontos ("Highlight"). Débito de
-- pontos (PointsHistory action HIGHLIGHT_TRACK) + criação do registro de
-- destaque acontecem na mesma transação no app (lib/store/highlight-service.ts).
-- Aditiva: não altera nenhuma coluna/tabela existente.

-- AlterEnum
ALTER TYPE "PointActionType" ADD VALUE 'HIGHLIGHT_TRACK';

-- CreateTable
CREATE TABLE "track_highlights" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cost_points" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "track_highlights_track_id_idx" ON "track_highlights"("track_id");

-- CreateIndex
CREATE INDEX "track_highlights_ends_at_idx" ON "track_highlights"("ends_at");

-- AddForeignKey
ALTER TABLE "track_highlights" ADD CONSTRAINT "track_highlights_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_highlights" ADD CONSTRAINT "track_highlights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
