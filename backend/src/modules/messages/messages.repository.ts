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
        sender: true
      },
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
}
