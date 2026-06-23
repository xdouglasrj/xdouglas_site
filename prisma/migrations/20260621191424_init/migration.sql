-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GUEST', 'MEMBER', 'ARTIST', 'ARTIST_SUPPORTER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DownloadStatus" AS ENUM ('INICIADO', 'CONCLUIDO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "WaitlistTipoUsuario" AS ENUM ('DJ', 'PRODUTOR', 'ARTISTA', 'OUTRO');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'TRACK_CREATE', 'TRACK_UPDATE', 'TRACK_DELETE', 'ARTIST_CREATE', 'ARTIST_UPDATE', 'ARTIST_DELETE', 'ADMIN_ACCESS', 'SUSPICIOUS_DOWNLOAD_FLAGGED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PAGE_VIEW', 'MUSIC_VIEW', 'DOWNLOAD_START', 'DOWNLOAD_COMPLETE', 'DOWNLOAD_FAILED', 'WAITLIST_JOIN', 'CONSENT_GIVEN', 'CONSENT_REVOKED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'GUEST',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "photo_key" TEXT,
    "photo_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "genre" TEXT,
    "bpm" INTEGER,
    "key" TEXT,
    "artist_id" TEXT NOT NULL,
    "producer_name" TEXT,
    "audio_key" TEXT NOT NULL,
    "audio_format" TEXT NOT NULL,
    "audio_size_bytes" BIGINT,
    "cover_key" TEXT,
    "cover_url" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "downloads" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "status" "DownloadStatus" NOT NULL DEFAULT 'INICIADO',
    "signed_url_expiry" TIMESTAMP(3),
    "download_suspeito" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_raw_events" (
    "id" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "ip_hash" TEXT,
    "hash_key_id" TEXT,
    "user_agent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "referer" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "track_id" TEXT,
    "session_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_raw_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "track_id" TEXT,
    "session_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_hash_keys" (
    "id" TEXT NOT NULL,
    "salt_encrypted" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_hash_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token_hash" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "device" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity_id" TEXT,
    "entity_type" TEXT,
    "metadata" JSONB,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "tipo_usuario" "WaitlistTipoUsuario" NOT NULL,
    "message" TEXT,
    "consented_at" TIMESTAMP(3) NOT NULL,
    "invited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "consent_type" TEXT NOT NULL,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "artists_slug_key" ON "artists"("slug");

-- CreateIndex
CREATE INDEX "artists_slug_idx" ON "artists"("slug");

-- CreateIndex
CREATE INDEX "artists_active_idx" ON "artists"("active");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_slug_key" ON "tracks"("slug");

-- CreateIndex
CREATE INDEX "tracks_slug_idx" ON "tracks"("slug");

-- CreateIndex
CREATE INDEX "tracks_artist_id_idx" ON "tracks"("artist_id");

-- CreateIndex
CREATE INDEX "tracks_published_idx" ON "tracks"("published");

-- CreateIndex
CREATE INDEX "tracks_genre_idx" ON "tracks"("genre");

-- CreateIndex
CREATE INDEX "downloads_track_id_idx" ON "downloads"("track_id");

-- CreateIndex
CREATE INDEX "downloads_download_suspeito_idx" ON "downloads"("download_suspeito");

-- CreateIndex
CREATE INDEX "downloads_created_at_idx" ON "downloads"("created_at");

-- CreateIndex
CREATE INDEX "downloads_status_idx" ON "downloads"("status");

-- CreateIndex
CREATE INDEX "downloads_track_id_download_suspeito_created_at_idx" ON "downloads"("track_id", "download_suspeito", "created_at");

-- CreateIndex
CREATE INDEX "analytics_raw_events_event_type_idx" ON "analytics_raw_events"("event_type");

-- CreateIndex
CREATE INDEX "analytics_raw_events_expires_at_idx" ON "analytics_raw_events"("expires_at");

-- CreateIndex
CREATE INDEX "analytics_raw_events_ip_hash_idx" ON "analytics_raw_events"("ip_hash");

-- CreateIndex
CREATE INDEX "analytics_raw_events_created_at_idx" ON "analytics_raw_events"("created_at");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "analytics_events_track_id_idx" ON "analytics_events"("track_id");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");

-- CreateIndex
CREATE INDEX "analytics_events_country_idx" ON "analytics_events"("country");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_created_at_idx" ON "analytics_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "analytics_hash_keys_active_idx" ON "analytics_hash_keys"("active");

-- CreateIndex
CREATE INDEX "analytics_hash_keys_period_end_idx" ON "analytics_hash_keys"("period_end");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_access_token_hash_key" ON "admin_sessions"("access_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_refresh_token_hash_key" ON "admin_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "admin_sessions_user_id_idx" ON "admin_sessions"("user_id");

-- CreateIndex
CREATE INDEX "admin_sessions_access_token_hash_idx" ON "admin_sessions"("access_token_hash");

-- CreateIndex
CREATE INDEX "admin_sessions_refresh_token_hash_idx" ON "admin_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_email_key" ON "waitlist"("email");

-- CreateIndex
CREATE INDEX "waitlist_tipo_usuario_idx" ON "waitlist"("tipo_usuario");

-- CreateIndex
CREATE INDEX "waitlist_invited_at_idx" ON "waitlist"("invited_at");

-- CreateIndex
CREATE INDEX "consent_events_session_id_idx" ON "consent_events"("session_id");

-- CreateIndex
CREATE INDEX "consent_events_created_at_idx" ON "consent_events"("created_at");

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
