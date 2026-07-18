-- Refresh-token rotation + reuse detection support.
-- Adds a `family` id shared by every token minted within one login session,
-- a `replacedByToken` pointer set when a token is rotated, and `revokedAt`
-- for audit purposes. Existing rows each get their own distinct family
-- (equivalent to a session of one, which is the correct default for tokens
-- issued before this migration).

-- AlterTable
ALTER TABLE "RefreshToken"
  ADD COLUMN "family" TEXT,
  ADD COLUMN "replacedByToken" TEXT,
  ADD COLUMN "revokedAt" TIMESTAMP(3);

-- Backfill: give every existing row its own family so historical tokens
-- are treated as independent single-token sessions.
UPDATE "RefreshToken" SET "family" = gen_random_uuid()::text WHERE "family" IS NULL;

ALTER TABLE "RefreshToken" ALTER COLUMN "family" SET NOT NULL;

-- CreateIndex
CREATE INDEX "RefreshToken_family_idx" ON "RefreshToken"("family");
