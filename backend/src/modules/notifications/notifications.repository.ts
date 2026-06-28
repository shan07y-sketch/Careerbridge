import { prisma } from '../../config/database';

export class NotificationsRepository {
  static async getNotifications(recipientId: string) {
    return prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async markAsRead(recipientId: string, id: string) {
    return prisma.notification.updateMany({
      where: { id, recipientId },
      data: { isRead: true }
    });
  }

  static async markAllAsRead(recipientId: string) {
    return prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true }
    });
  }

  static async deleteNotification(recipientId: string, id: string) {
    return prisma.notification.deleteMany({
      where: { id, recipientId }
    });
  }
}
