-- University AI (Phase 5): AI-generated placement prediction and risk
-- assessment for a student, reusing Resume Intelligence (Phase 1) and Mock
-- Interview AI (Phase 2) signals the same way Career Intelligence and
-- Employer AI already do. History table (not unique per student) so the
-- placement cell can re-run the assessment over time; latest row is fetched
-- via `orderBy: { createdAt: 'desc' }, take: 1`.

CREATE TABLE "StudentPlacementInsight" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "placementProbability" INTEGER NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "riskFactors" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "suggestedActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "modelVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StudentPlacementInsight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudentPlacementInsight_studentProfileId_idx" ON "StudentPlacementInsight"("studentProfileId");

ALTER TABLE "StudentPlacementInsight"
  ADD CONSTRAINT "StudentPlacementInsight_studentProfileId_fkey"
  FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
