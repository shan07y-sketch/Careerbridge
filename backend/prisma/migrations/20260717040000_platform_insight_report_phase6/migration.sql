-- Admin AI (Phase 6): a single generic history table for every Admin AI
-- report type (fraud detection, platform insights, moderation
-- recommendations, system health, executive reports, predictive analytics)
-- rather than six near-identical tables -- `reportType` discriminates which
-- kind of report a row is, and `payload` holds that report's full JSON
-- response shape exactly as returned by the ai-engine. History table (not
-- unique per type) so an admin can re-run any report over time; latest row
-- for a type is fetched via `orderBy: { createdAt: 'desc' }, take: 1`.

CREATE TABLE "PlatformInsightReport" (
  "id" TEXT NOT NULL,
  "reportType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "modelVersion" TEXT NOT NULL,
  "generatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlatformInsightReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlatformInsightReport_reportType_idx" ON "PlatformInsightReport"("reportType");

ALTER TABLE "PlatformInsightReport"
  ADD CONSTRAINT "PlatformInsightReport_generatedBy_fkey"
  FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
