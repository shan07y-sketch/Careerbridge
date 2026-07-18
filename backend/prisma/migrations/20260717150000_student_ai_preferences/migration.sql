-- Student Settings "AI Preferences" tab was editable but never persisted
-- anywhere. Minimal additive columns on StudentProfile.
ALTER TABLE "StudentProfile" ADD COLUMN "careerPath" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "targetCompanies" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "targetSalaryRange" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "jobTypePreference" TEXT DEFAULT 'Full-Time';
ALTER TABLE "StudentProfile" ADD COLUMN "preferredIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "StudentProfile" ADD COLUMN "recommendationFrequency" TEXT DEFAULT 'Daily';
