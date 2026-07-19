import { prisma } from '../../config/database';

/** Data access for the AI Career Coach chat (conversations + messages). */
export class CoachRepository {
  /** Resolve the student profile (id + identity fields) from a user id. */
  static async getProfile(userId: string) {
    return prisma.studentProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        graduationYear: true,
        preferredRole: true,
        careerPath: true,
        targetCompanies: true,
        targetSalaryRange: true,
        jobTypePreference: true,
        preferredIndustries: true,
        university: { select: { name: true } },
        department: { select: { name: true } }
      }
    });
  }

  static async listConversations(studentProfileId: string) {
    return prisma.aiConversation.findMany({
      where: { studentProfileId },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        title: true,
        pinned: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, role: true }
        }
      }
    });
  }

  static async createConversation(studentProfileId: string, title?: string) {
    return prisma.aiConversation.create({
      data: { studentProfileId, ...(title ? { title } : {}) }
    });
  }

  /** Fetch a conversation the caller owns, with its full message history. */
  static async getConversation(studentProfileId: string, id: string) {
    return prisma.aiConversation.findFirst({
      where: { id, studentProfileId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
  }

  static async ownsConversation(studentProfileId: string, id: string): Promise<boolean> {
    const found = await prisma.aiConversation.findFirst({ where: { id, studentProfileId }, select: { id: true } });
    return !!found;
  }

  static async addMessage(conversationId: string, role: 'user' | 'assistant', content: string, estimated = false) {
    const message = await prisma.aiMessage.create({
      data: { conversationId, role, content, estimated }
    });
    // Bump the conversation so it sorts to the top of the history list.
    await prisma.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return message;
  }

  static async setTitleIfDefault(conversationId: string, title: string) {
    await prisma.aiConversation.updateMany({
      where: { id: conversationId, title: 'New conversation' },
      data: { title }
    });
  }

  static async updateConversation(studentProfileId: string, id: string, data: { title?: string; pinned?: boolean }) {
    const res = await prisma.aiConversation.updateMany({ where: { id, studentProfileId }, data });
    return res.count > 0;
  }

  static async deleteConversation(studentProfileId: string, id: string) {
    const res = await prisma.aiConversation.deleteMany({ where: { id, studentProfileId } });
    return res.count > 0;
  }
}
