-- Hiring Pipeline Workflow: application status extension, offers, internal
-- notes, and recruiter attribution on interviews.

-- Add SHORTLISTED to ApplicationStatus (distinct from generic REVIEWING/SCREENING progression)
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'SHORTLISTED';

-- New enum for offer lifecycle
DO $$ BEGIN
  CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'EXTENDED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Recruiter attribution on Interview (nullable, backward compatible)
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "scheduledByRecruiterId" TEXT;
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_scheduledByRecruiterId_fkey"
  FOREIGN KEY ("scheduledByRecruiterId") REFERENCES "Recruiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Internal notes / comments on an application
CREATE TABLE IF NOT EXISTS "ApplicationNote" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "authorRecruiterId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ApplicationNote_applicationId_idx" ON "ApplicationNote"("applicationId");

ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_authorRecruiterId_fkey"
  FOREIGN KEY ("authorRecruiterId") REFERENCES "Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Offers
CREATE TABLE IF NOT EXISTS "Offer" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "createdByRecruiterId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "salary" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "startDate" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
  "extendedAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "withdrawnAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Offer_applicationId_key" ON "Offer"("applicationId");

ALTER TABLE "Offer" ADD CONSTRAINT "Offer_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_createdByRecruiterId_fkey"
  FOREIGN KEY ("createdByRecruiterId") REFERENCES "Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
