-- CreateEnum
CREATE TYPE "PointActionType" AS ENUM ('USER_REGISTERED', 'PROFILE_COMPLETED', 'AVATAR_ADDED', 'FIRST_LOGIN', 'DAILY_LOGIN', 'DAILY_LOGIN_STREAK_BONUS', 'TRACK_LIKED', 'COMMENT_CREATED', 'TRACK_SHARED', 'TRACK_PUBLISHED', 'TRACK_PLAYED', 'PLAYLIST_CREATED', 'FRIEND_INVITE_COMPLETED', 'TRACK_MILESTONE_1000', 'STORE_REDEMPTION', 'INVITE_ABUSE_PENALTY', 'ADMIN_GIFT', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "StoreAudience" AS ENUM ('ARTIST', 'LISTENER', 'BOTH');

-- CreateEnum
CREATE TYPE "StoreItemKey" AS ENUM ('PRIORITY_INVITE', 'PIN_TRACK_COMMENT', 'FEATURE_TRACK', 'EXTRA_STORAGE', 'MAPPING_ACCESS', 'APP_PREMIUM', 'PIN_FEED_POST');

-- CreateEnum
CREATE TYPE "StorePurchaseStatus" AS ENUM ('AWAITING_USE', 'ACTIVE', 'USED', 'EXPIRED', 'REFUNDED');

-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "invite_abuse_block_days" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "store_dynamic_price_increase_percent" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "store_dynamic_price_threshold_count" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "store_dynamic_price_window_hours" INTEGER NOT NULL DEFAULT 720;

-- AlterTable
ALTER TABLE "forum_threads" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "pinned_expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "track_comments" ADD COLUMN     "pinned_expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "featured_until" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "app_premium_expires_at" TIMESTAMP(3),
ADD COLUMN     "bonus_storage_mb" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "invite_abuse_level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "invite_blocked_until" TIMESTAMP(3),
ADD COLUMN     "last_daily_login_at" TIMESTAMP(3),
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "login_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mapping_expires_at" TIMESTAMP(3),
ADD COLUMN     "priority_invite_credits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_xp" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "waitlist" ADD COLUMN     "priority" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referred_by_user_id" TEXT;

-- CreateTable
CREATE TABLE "points_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "PointActionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_items" (
    "id" TEXT NOT NULL,
    "key" "StoreItemKey" NOT NULL,
    "label" TEXT NOT NULL,
    "audience" "StoreAudience" NOT NULL,
    "price" INTEGER NOT NULL,
    "max_concurrent" INTEGER,
    "sale_window_hours" INTEGER,
    "sale_window_limit" INTEGER,
    "duration_hours" INTEGER,
    "max_purchases_per_user" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "store_item_id" TEXT NOT NULL,
    "price_paid" INTEGER NOT NULL,
    "status" "StorePurchaseStatus" NOT NULL DEFAULT 'AWAITING_USE',
    "target_type" TEXT,
    "target_id" TEXT,
    "is_gift" BOOLEAN NOT NULL DEFAULT false,
    "gifted_by_admin_id" TEXT,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usable_until" TIMESTAMP(3),
    "used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "store_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_threshold_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "store_item_id" TEXT NOT NULL,
    "price_at_reach" INTEGER NOT NULL,
    "reached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_threshold_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_price_adjustments" (
    "id" TEXT NOT NULL,
    "store_item_id" TEXT NOT NULL,
    "old_price" INTEGER NOT NULL,
    "new_price" INTEGER NOT NULL,
    "triggered_by_count" INTEGER NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_price_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_promotions" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "weekday" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "points_history_user_id_created_at_idx" ON "points_history"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "points_history_action_idx" ON "points_history"("action");

-- CreateIndex
CREATE UNIQUE INDEX "store_items_key_key" ON "store_items"("key");

-- CreateIndex
CREATE INDEX "store_purchases_user_id_idx" ON "store_purchases"("user_id");

-- CreateIndex
CREATE INDEX "store_purchases_store_item_id_purchased_at_idx" ON "store_purchases"("store_item_id", "purchased_at");

-- CreateIndex
CREATE INDEX "store_purchases_status_idx" ON "store_purchases"("status");

-- CreateIndex
CREATE INDEX "store_threshold_events_store_item_id_reached_at_idx" ON "store_threshold_events"("store_item_id", "reached_at");

-- CreateIndex
CREATE UNIQUE INDEX "store_threshold_events_user_id_store_item_id_price_at_reach_key" ON "store_threshold_events"("user_id", "store_item_id", "price_at_reach");

-- CreateIndex
CREATE INDEX "store_price_adjustments_store_item_id_created_at_idx" ON "store_price_adjustments"("store_item_id", "created_at");

-- CreateIndex
CREATE INDEX "waitlist_referred_by_user_id_idx" ON "waitlist"("referred_by_user_id");

-- CreateIndex
CREATE INDEX "waitlist_priority_idx" ON "waitlist"("priority");

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_referred_by_user_id_fkey" FOREIGN KEY ("referred_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_history" ADD CONSTRAINT "points_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_purchases" ADD CONSTRAINT "store_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_purchases" ADD CONSTRAINT "store_purchases_store_item_id_fkey" FOREIGN KEY ("store_item_id") REFERENCES "store_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_threshold_events" ADD CONSTRAINT "store_threshold_events_store_item_id_fkey" FOREIGN KEY ("store_item_id") REFERENCES "store_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_price_adjustments" ADD CONSTRAINT "store_price_adjustments_store_item_id_fkey" FOREIGN KEY ("store_item_id") REFERENCES "store_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
