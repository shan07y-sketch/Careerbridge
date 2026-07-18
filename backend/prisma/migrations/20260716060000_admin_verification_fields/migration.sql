-- Admin Portal Phase 1/2: real verification + activity tracking fields
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

ALTER TABLE "Company" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN "verifiedAt" TIMESTAMP(3);

ALTER TABLE "University" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "University" ADD COLUMN "verifiedAt" TIMESTAMP(3);
