import { prisma } from '../../config/database';
import { MessageStatus } from '@prisma/client';

export class MessagesRepository {
  static async getConversations(studentProfileId: string) {
    return prisma.conversation.findMany({
      where: {
        participants: {
          some: { studentProfileId }
        }
      },
      include: {
        participants: {
          include: {
            studentProfile: {
              include: {
                user: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async getMessagesByConversationId(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: true,
        senderRecruiter: { include: { user: true } }
      } as any,
      orderBy: { createdAt: 'asc' }
    });
  }

  static async createConversation(studentProfileIds: string[]) {
    return prisma.conversation.create({
      data: {
        participants: {
          create: studentProfileIds.map(studentProfileId => ({
            studentProfileId
          }))
        }
      }
    });
  }

  static async findConversationByParticipants(studentProfileIds: string[]) {
    return prisma.conversation.findFirst({
      where: {
        AND: studentProfileIds.map(id => ({
          participants: {
            some: { studentProfileId: id }
          }
        }))
      }
    });
  }


  static async sendMessage(conversationId: string, senderId: string, content: string) {
    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content,
          status: MessageStatus.SENT
        }
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      return message;
    });
  }

  // ------------------------------------------------------------------
  // Recruiter-side of the same Conversation/Message tables (Employer
  // Messaging tab). Reuses every model above -- no parallel messaging
  // system. A recruiter can only reach candidates who applied to one of
  // their company's jobs; that check lives in EmployerService, not here.
  // ------------------------------------------------------------------

  // Casts below are temporary: ConversationParticipant.recruiterId /
  // Message.senderRecruiterId are real columns (migration
  // 20260717140000_employer_messaging) but the Prisma Client here hasn't
  // been regenerated against them yet (no network route to Prisma's engine
  // host from this sandbox). Remove every `as any` in this section once
  // `npx prisma generate` has been run locally.
  static async getConversationsForRecruiter(recruiterId: string) {
    return prisma.conversation.findMany({
      where: { participants: { some: { recruiterId } } } as any,
      include: {
        participants: {
          include: {
            studentProfile: { include: { user: true } },
            recruiter: { include: { user: true } }
          }
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      } as any,
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async findConversationBetweenRecruiterAndStudent(recruiterId: string, studentProfileId: string) {
    return prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { recruiterId } } },
          { participants: { some: { studentProfileId } } }
        ]
      } as any
    });
  }

  static async createConversationRecruiterStudent(recruiterId: string, studentProfileId: string) {
    return prisma.conversation.create({
      data: {
        participants: {
          create: [{ recruiterId }, { studentProfileId }]
        }
      } as any
    });
  }

  static async sendMessageAsRecruiter(conversationId: string, recruiterId: string, content: string) {
    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderRecruiterId: recruiterId,
          content,
          status: MessageStatus.SENT
        } as any
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      return message;
    });
  }
}
