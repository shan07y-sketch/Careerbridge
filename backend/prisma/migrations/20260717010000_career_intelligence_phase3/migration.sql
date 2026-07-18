-- Career Intelligence (Phase 3): ties Resume Intelligence and Mock Interview
-- AI together into one continuous readiness signal for a student's chosen
-- target role. All new columns are nullable/defaulted so existing seeded
-- CareerInsight rows (summary/score/status/modelVersion only) remain valid.

ALTER TABLE "CareerInsight"
  ADD COLUMN "targetRole" TEXT,
  ADD COLUMN "readinessPercent" INTEGER,
  ADD COLUMN "whyThisScore" TEXT,
  ADD COLUMN "matchedSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "missingSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "recommendedProjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "recommendedCourses" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "recommendedInterviewTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "roadmap" JSONB;
