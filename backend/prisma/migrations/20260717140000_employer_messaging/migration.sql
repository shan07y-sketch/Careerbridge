-- Reuses the existing Conversation/ConversationParticipant/Message tables
-- (previously student<->student only) for the Employer Messaging tab,
-- instead of creating a parallel messaging system. A participant/sender is
-- either a student or a recruiter, never both -- enforced in
-- MessagesRepository application code, not a DB constraint, to keep this
-- migration minimal.

ALTER TABLE "ConversationParticipant"
  ALTER COLUMN "studentProfileId" DROP NOT NULL,
  ADD COLUMN "recruiterId" TEXT;

ALTER TABLE "ConversationParticipant"
  ADD CONSTRAINT "ConversationParticipant_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ConversationParticipant_conversationId_recruiterId_key"
  ON "ConversationParticipant"("conversationId", "recruiterId");

ALTER TABLE "Message"
  ALTER COLUMN "senderId" DROP NOT NULL,
  ADD COLUMN "senderRecruiterId" TEXT;

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_senderRecruiterId_fkey"
    FOREIGN KEY ("senderRecruiterId") REFERENCES "Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
