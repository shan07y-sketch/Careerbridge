-- Mock Interview AI (Phase 2): session tracking, per-question Q&A trail,
-- and the rich scoring breakdown for the final report. All new
-- MockInterviewReport columns are nullable/defaulted so existing seeded
-- rows (which only ever populated summary/score/status/modelVersion)
-- remain valid without a backfill.

CREATE TYPE "InterviewSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

ALTER TABLE "MockInterview"
  ADD COLUMN "targetRole" TEXT,
  ADD COLUMN "numQuestions" INTEGER NOT NULL DEFAULT 6,
  ADD COLUMN "status" "InterviewSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  ADD COLUMN "aiEngineSessionId" TEXT,
  ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE TABLE "InterviewQuestion" (
    "id" TEXT NOT NULL,
    "mockInterviewId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "questionType" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerTranscript" TEXT,
    "audioUrl" TEXT,
    "videoUrl" TEXT,
    "wordsPerMinute" DOUBLE PRECISION,
    "fillerWordCount" INTEGER,
    "eyeContactPercent" DOUBLE PRECISION,
    "smileFrequencyPercent" DOUBLE PRECISION,
    "postureScore" DOUBLE PRECISION,
    "headMovementScore" DOUBLE PRECISION,
    "answerQualityScore" INTEGER,
    "technicalAccuracy" INTEGER,
    "grammarScore" INTEGER,
    "feedback" TEXT,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InterviewQuestion_mockInterviewId_questionIndex_key" ON "InterviewQuestion"("mockInterviewId", "questionIndex");

ALTER TABLE "InterviewQuestion" ADD CONSTRAINT "InterviewQuestion_mockInterviewId_fkey" FOREIGN KEY ("mockInterviewId") REFERENCES "MockInterview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MockInterviewReport"
  ADD COLUMN "technicalScore" INTEGER,
  ADD COLUMN "hrScore" INTEGER,
  ADD COLUMN "communicationScore" INTEGER,
  ADD COLUMN "confidenceScore" INTEGER,
  ADD COLUMN "grammarScore" INTEGER,
  ADD COLUMN "answerQualityScore" INTEGER,
  ADD COLUMN "eyeContactPercent" DOUBLE PRECISION,
  ADD COLUMN "smileFrequencyPercent" DOUBLE PRECISION,
  ADD COLUMN "bodyLanguageScore" DOUBLE PRECISION,
  ADD COLUMN "headMovementScore" DOUBLE PRECISION,
  ADD COLUMN "speakingSpeedWpm" DOUBLE PRECISION,
  ADD COLUMN "fillerWordCount" INTEGER,
  ADD COLUMN "improvementPlan" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "suggestedCourses" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "suggestedQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "aiSummary" TEXT;
