-- Employer Company Profile tab: add real, persisted columns for fields the
-- editor previously stored only in local React state (cover image, mission
-- values, tech stack, gallery images, office locations, recruiting targets).
ALTER TABLE "Company"
  ADD COLUMN "coverImageUrl" TEXT,
  ADD COLUMN "missionValues" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "techStack" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "galleryImages" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "officeLocations" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "screenedTarget" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN "outreachTarget" INTEGER NOT NULL DEFAULT 20;
