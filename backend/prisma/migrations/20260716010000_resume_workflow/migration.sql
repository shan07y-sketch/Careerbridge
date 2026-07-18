-- Resume workflow: version history, metadata, skill-extraction interface,
-- and secure sharing.

-- AlterTable
ALTER TABLE "Resume"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "fileSizeBytes" INTEGER,
  ADD COLUMN "mimeType" TEXT,
  ADD COLUMN "extractedSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "shareToken" TEXT,
  ADD COLUMN "shareEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "shareExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Resume_shareToken_key" ON "Resume"("shareToken");

-- CreateIndex
CREATE INDEX "Resume_studentProfileId_isActive_idx" ON "Resume"("studentProfileId", "isActive");
