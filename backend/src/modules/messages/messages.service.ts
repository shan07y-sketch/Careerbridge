import { eventBus } from '../shared/event-bus';
import { MessagesRepository } from './messages.repository';
import { ProfileRepository } from '../profile/profile.repository';
import { AppError } from '../../utils/app-error';

export class MessagesService {
  static async getConversations(userId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    return MessagesRepository.getConversations(profile.id);
  }

  static async getMessages(userId: string, conversationId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    return MessagesRepository.getMessagesByConversationId(conversationId);
  }

  static async sendMessage(userId: string, conversationId: string, content: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const message = await MessagesRepository.sendMessage(conversationId, profile.id, content);
    eventBus.emit('MessageSent', message);
    return message;
  }

  static async startConversation(userId: string, recipientProfileId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const ids = [profile.id, recipientProfileId];
    const existing = await MessagesRepository.findConversationByParticipants(ids);
    if (existing) return existing;

    return MessagesRepository.createConversation(ids);
  }
}
