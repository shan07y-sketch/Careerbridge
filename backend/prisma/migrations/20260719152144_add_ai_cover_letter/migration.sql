-- CreateTable
CREATE TABLE "CoverLetter" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "jobId" TEXT,
    "targetRole" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
    "content" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoverLetter_studentProfileId_createdAt_idx" ON "CoverLetter"("studentProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "CoverLetter_jobId_idx" ON "CoverLetter"("jobId");

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
