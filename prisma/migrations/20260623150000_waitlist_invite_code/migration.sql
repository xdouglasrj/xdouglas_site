ALTER TABLE "waitlist" ADD COLUMN "invite_code" TEXT;
ALTER TABLE "waitlist" ADD COLUMN "used_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "waitlist_invite_code_key" ON "waitlist"("invite_code");
