CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "auto_accept_enabled" BOOLEAN NOT NULL DEFAULT false,
    "auto_accept_remaining" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);
