-- Recruiters had no name storage anywhere in the schema (User only has
-- email/role); registerUser() already collects firstName/lastName at
-- signup for every role but was discarding them for EMPLOYER. Nullable
-- since existing recruiter rows predate this column.
ALTER TABLE "Recruiter"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT;
