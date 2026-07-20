-- Two-step verification (TOTP).
--
-- Written by hand rather than generated, and guarded with IF NOT EXISTS,
-- because the schema had already been applied to the development database with
-- `prisma db push` (which records no migration). Production deploys run
-- `prisma migrate deploy`, so without this file the deployed client expected
-- User.twoFactorSecret against a database that never received it, and every
-- login failed. The guards make this migration safe to apply to a database
-- that already has the columns.

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnrolledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TwoFactorRecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TwoFactorRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TwoFactorRecoveryCode_userId_idx" ON "TwoFactorRecoveryCode"("userId");

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "TwoFactorRecoveryCode" ADD CONSTRAINT "TwoFactorRecoveryCode_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
