-- Restore the `title` column on PlatformAnnouncement.
-- It was dropped by 20260717112030_npx_prisma_db_pull, but the Admin
-- Announcements UI and admin service/repository require it (create validates a
-- title, the list renders it, the delete dialog references it). Re-added as
-- NOT NULL with an empty-string default so pre-existing rows remain valid.
ALTER TABLE "PlatformAnnouncement" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
