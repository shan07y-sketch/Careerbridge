-- Data repair: reconcile Job.status with the legacy Job.isPublished flag.
--
-- The seed pipeline used to emit only `isPublished`, leaving `status` at its
-- schema default of DRAFT. The student feed filtered on the legacy flag, so
-- these rows were visible to students while their employers saw them as
-- unpublished drafts. Now that the feed correctly filters on `status`, those
-- same rows would vanish from the feed entirely unless repaired.
--
-- The condition is deliberately narrow. A job drafted through the employer
-- portal always has isPublished = false, because the portal derives the flag
-- from the status (EmployerRepository.deriveLegacyFlags). The combination
-- targeted here — DRAFT with isPublished = true — is only ever produced by the
-- old seed path, so no genuinely-drafted job is published by this statement.
--
-- Idempotent: re-running matches no rows.
UPDATE "Job"
SET "status" = 'PUBLISHED'
WHERE "status" = 'DRAFT'
  AND "isPublished" = true
  AND "isDeleted" = false;
