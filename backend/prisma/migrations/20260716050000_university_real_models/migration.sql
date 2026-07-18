-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'PLACEMENT_ELIGIBLE', 'PLACEMENT_COMPLETED', 'REJECTED');

-- AlterTable: add real verification-status column, backfilling from the
-- legacy "VERIFIED_STATUS:<status>:<role>" string smuggled into preferredRole
ALTER TABLE "StudentProfile" ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "StudentProfile"
SET "verificationStatus" = CASE
  WHEN "preferredRole" LIKE 'VERIFIED_STATUS:Placement Completed%' THEN 'PLACEMENT_COMPLETED'::"VerificationStatus"
  WHEN "preferredRole" LIKE 'VERIFIED_STATUS:Placement Eligible%' THEN 'PLACEMENT_ELIGIBLE'::"VerificationStatus"
  WHEN "preferredRole" LIKE 'VERIFIED_STATUS:Verified%' THEN 'VERIFIED'::"VerificationStatus"
  WHEN "preferredRole" LIKE 'VERIFIED_STATUS:Rejected%' THEN 'REJECTED'::"VerificationStatus"
  WHEN "preferredRole" LIKE 'VERIFIED_STATUS:%' THEN 'PENDING'::"VerificationStatus"
  ELSE 'PENDING'::"VerificationStatus"
END
WHERE "preferredRole" LIKE 'VERIFIED_STATUS:%';

-- Strip the legacy encoding back out of preferredRole now that the real
-- column carries the status, restoring the original role text (if any).
UPDATE "StudentProfile"
SET "preferredRole" = NULLIF(
  SUBSTRING("preferredRole" FROM POSITION(':' IN SUBSTRING("preferredRole" FROM POSITION(':' IN "preferredRole") + 1)) + POSITION(':' IN "preferredRole") + 1),
  ''
)
WHERE "preferredRole" LIKE 'VERIFIED_STATUS:%';

-- CreateTable
CREATE TABLE "PlacementDrive" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementDrive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlacementDrive_universityId_idx" ON "PlacementDrive"("universityId");

-- AddForeignKey
ALTER TABLE "PlacementDrive" ADD CONSTRAINT "PlacementDrive_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: migrate existing CAMPUS_DRIVE-encoded Event rows into real
-- PlacementDrive rows, then remove them from Event so they aren't
-- double-counted by any Event-based feature.
INSERT INTO "PlacementDrive" ("id", "universityId", "title", "description", "location", "scheduledAt", "deadline", "isDeleted", "deletedAt", "createdAt", "updatedAt")
SELECT
  "id",
  SPLIT_PART("title", ':', 2) AS "universityId",
  SUBSTRING("title" FROM POSITION(':' IN SUBSTRING("title" FROM POSITION(':' IN "title") + 1)) + POSITION(':' IN "title") + 1) AS "title",
  COALESCE("description", ''),
  COALESCE("location", ''),
  "scheduledAt",
  COALESCE("deadline", "scheduledAt"),
  "isDeleted",
  "deletedAt",
  "createdAt",
  "updatedAt"
FROM "Event"
WHERE "title" LIKE 'CAMPUS_DRIVE:%';

DELETE FROM "Event" WHERE "title" LIKE 'CAMPUS_DRIVE:%';
