-- Introduce a real JobStatus enum on Job instead of the isPublished/isDeleted +
-- currency-string-prefix hack ("PAUSED:USD" / "CLOSED:USD") used previously.
-- isPublished/isDeleted are KEPT (student-facing jobs.repository.ts filters on
-- them directly) and are now kept in sync by the service layer whenever
-- `status` changes, rather than being the source of truth themselves.

-- 1. Create the enum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'ARCHIVED');

-- 2. Add the column with a temporary default so backfill can run
ALTER TABLE "Job" ADD COLUMN "status" "JobStatus" NOT NULL DEFAULT 'DRAFT';

-- 3. Backfill from existing signals:
--    isDeleted            -> ARCHIVED
--    currency LIKE 'PAUSED:%'  -> PAUSED (and strip the prefix back to a real currency code)
--    currency LIKE 'CLOSED:%'  -> CLOSED (and strip the prefix back to a real currency code)
--    isPublished (else)   -> PUBLISHED
--    else                 -> DRAFT
UPDATE "Job" SET "status" = 'ARCHIVED' WHERE "isDeleted" = true;

UPDATE "Job" SET
  "status" = 'PAUSED',
  "currency" = substring("currency" from 8)
WHERE "isDeleted" = false AND "currency" LIKE 'PAUSED:%';

UPDATE "Job" SET
  "status" = 'CLOSED',
  "currency" = substring("currency" from 8)
WHERE "isDeleted" = false AND "currency" LIKE 'CLOSED:%';

UPDATE "Job" SET "status" = 'PUBLISHED'
WHERE "isDeleted" = false AND "isPublished" = true AND "status" = 'DRAFT'
  AND "currency" NOT LIKE 'PAUSED:%' AND "currency" NOT LIKE 'CLOSED:%';

-- Any row where isPublished = false and isDeleted = false remains DRAFT (the
-- column default already covers this case, no additional UPDATE needed).

-- 4. Guard against any stray prefixed currency values left over
UPDATE "Job" SET "currency" = substring("currency" from 8) WHERE "currency" LIKE 'PAUSED:%' OR "currency" LIKE 'CLOSED:%';
