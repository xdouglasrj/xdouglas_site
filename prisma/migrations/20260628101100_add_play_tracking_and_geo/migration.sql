-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'PLAY_START';
ALTER TYPE "EventType" ADD VALUE 'PLAY_30S';
ALTER TYPE "EventType" ADD VALUE 'PLAY_COMPLETE';

-- AlterTable
ALTER TABLE "analytics_events" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
