import { NotificationsRepository } from './notifications.repository';
import { prisma } from '../../config/database';
import { eventBus } from '../shared/event-bus';

export class NotificationsService {
  static async getNotifications(userId: string) {
    return NotificationsRepository.getNotifications(userId);
  }

  static async markAsRead(userId: string, id: string) {
    return NotificationsRepository.markAsRead(userId, id);
  }

  static async markAllAsRead(userId: string) {
    return NotificationsRepository.markAllAsRead(userId);
  }

  static async deleteNotification(userId: string, id: string) {
    return NotificationsRepository.deleteNotification(userId, id);
  }

  static async createNotification(data: {
    recipientId: string;
    type: string;
    title: string;
    content: string;
    priority?: string;
  }) {
    const notif = await prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        type: data.type as any,
        title: data.title,
        content: data.content,
        priority: (data.priority || 'MEDIUM') as any,
        isRead: false
      }
    });

    eventBus.emit('NotificationCreated', notif);
    return notif;
  }
}
