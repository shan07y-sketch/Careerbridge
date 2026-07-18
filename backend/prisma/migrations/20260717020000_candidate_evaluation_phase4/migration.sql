-- Employer AI (Phase 4): AI-generated candidate fit evaluations against a
-- job, reusing Resume Intelligence (Phase 1) and Mock Interview AI (Phase 2)
-- signals. History table (not unique per application) so a recruiter can
-- re-run the evaluation over time; latest row is fetched via
-- `orderBy: { createdAt: 'desc' }, take: 1`.

CREATE TABLE "CandidateEvaluation" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "fitScore" INTEGER NOT NULL,
  "recommendation" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "concerns" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "skillsMatch" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "skillsGap" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "interviewSignal" TEXT,
  "modelVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CandidateEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CandidateEvaluation_applicationId_idx" ON "CandidateEvaluation"("applicationId");

ALTER TABLE "CandidateEvaluation"
  ADD CONSTRAINT "CandidateEvaluation_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
