-- CreateTable: CompanyRating
CREATE TABLE "CompanyRating" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompanyRating_companyId_authorId_key" ON "CompanyRating"("companyId", "authorId");
CREATE INDEX "CompanyRating_companyId_idx" ON "CompanyRating"("companyId");

ALTER TABLE "CompanyRating" ADD CONSTRAINT "CompanyRating_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyRating" ADD CONSTRAINT "CompanyRating_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: MentorAvailability
CREATE TABLE "MentorAvailability" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MentorAvailability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MentorAvailability_mentorId_startTime_idx" ON "MentorAvailability"("mentorId", "startTime");

ALTER TABLE "MentorAvailability" ADD CONSTRAINT "MentorAvailability_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
