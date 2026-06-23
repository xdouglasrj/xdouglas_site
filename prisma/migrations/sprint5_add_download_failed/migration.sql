-- Migration Sprint 5: adiciona DOWNLOAD_FAILED ao enum EventType
-- Executar com: npx prisma migrate dev --name add_download_failed
--
-- PostgreSQL não suporta ALTER TYPE ADD VALUE dentro de uma transação,
-- então esta migration usa a forma direta suportada pelo Prisma.

ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'DOWNLOAD_FAILED';
