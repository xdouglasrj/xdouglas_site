-- V3 Plano 19 — preferências de notificação + tema (aditiva, sem impacto em dados existentes)
ALTER TABLE "users" ADD COLUMN "notification_prefs" JSONB;
ALTER TABLE "users" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'dark';
