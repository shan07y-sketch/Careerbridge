-- CreateEnum
CREATE TYPE "MockInterviewType" AS ENUM ('HR', 'TECHNICAL', 'BEHAVIORAL', 'APTITUDE', 'MIXED');

-- CreateEnum
CREATE TYPE "InterviewDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "InterviewQuestion" ADD COLUMN     "answerDurationSec" DOUBLE PRECISION,
ADD COLUMN     "answerMethod" TEXT,
ADD COLUMN     "answeredAt" TIMESTAMP(3),
ADD COLUMN     "askedAt" TIMESTAMP(3),
ADD COLUMN     "communicationScore" INTEGER,
ADD COLUMN     "completenessScore" INTEGER,
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "evaluationEstimated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expectedSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "problemSolvingScore" INTEGER,
ADD COLUMN     "relevanceScore" INTEGER,
ADD COLUMN     "suggestedBetterAnswer" TEXT;

-- AlterTable
ALTER TABLE "MockInterview" ADD COLUMN     "cameraObservations" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "contextSnapshot" JSONB,
ADD COLUMN     "difficulty" "InterviewDifficulty" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "interviewType" "MockInterviewType" NOT NULL DEFAULT 'MIXED',
ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "planEstimated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "questionPlan" JSONB,
ADD COLUMN     "sharedAt" TIMESTAMP(3),
ADD COLUMN     "sharedWithEmployers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalDurationSec" INTEGER;

-- AlterTable
ALTER TABLE "MockInterviewReport" ADD COLUMN     "behavioralScore" INTEGER,
ADD COLUMN     "cameraSummary" JSONB,
ADD COLUMN     "careerRecommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "estimated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "interviewReadiness" INTEGER,
ADD COLUMN     "jobMatchPercent" INTEGER,
ADD COLUMN     "learningRoadmap" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "missingSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "problemSolvingScore" INTEGER,
ADD COLUMN     "questionBreakdown" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "recommendedCertifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "recommendedProjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "skillMatchPercent" INTEGER,
ADD COLUMN     "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "MockInterview_studentProfileId_status_idx" ON "MockInterview"("studentProfileId", "status");

-- AddForeignKey
ALTER TABLE "MockInterview" ADD CONSTRAINT "MockInterview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
