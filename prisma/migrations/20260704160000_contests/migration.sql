-- V3 Plano 6 — Contests (concursos de remix)
-- Migration ADITIVA: só cria tabelas novas. Não altera nem remove nada
-- existente. Prêmio em pontos (ADMIN_GIFT, já existe no enum
-- PointActionType) + destaque (featuredUntil, já existe em tracks).

-- CreateTable
CREATE TABLE "contests" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cover_key" TEXT,
    "stems_key" TEXT,
    "host_artist_id" TEXT,
    "prize_points" INTEGER NOT NULL DEFAULT 0,
    "prize_text" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_entries" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "winner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contests_slug_key" ON "contests"("slug");

-- CreateIndex
CREATE INDEX "contests_published_idx" ON "contests"("published");

-- CreateIndex
CREATE INDEX "contests_deadline_idx" ON "contests"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "contest_entries_track_id_key" ON "contest_entries"("track_id");

-- CreateIndex
CREATE INDEX "contest_entries_contest_id_idx" ON "contest_entries"("contest_id");

-- CreateIndex
CREATE INDEX "contest_entries_user_id_idx" ON "contest_entries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contest_entries_contest_id_user_id_key" ON "contest_entries"("contest_id", "user_id");

-- AddForeignKey
ALTER TABLE "contests" ADD CONSTRAINT "contests_host_artist_id_fkey" FOREIGN KEY ("host_artist_id") REFERENCES "artists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_entries" ADD CONSTRAINT "contest_entries_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_entries" ADD CONSTRAINT "contest_entries_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_entries" ADD CONSTRAINT "contest_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
