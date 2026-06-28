import { eventBus } from './event-bus';

export type UserStatus = 'ONLINE' | 'OFFLINE' | 'AWAY';

export interface PresenceInfo {
  status: UserStatus;
  lastSeen: Date;
}

export class PresenceService {
  private static userPresences = new Map<string, PresenceInfo>();

  static setUserOnline(userId: string) {
    const prev = this.userPresences.get(userId);
    const info: PresenceInfo = { status: 'ONLINE', lastSeen: new Date() };
    this.userPresences.set(userId, info);

    if (!prev || prev.status !== 'ONLINE') {
      eventBus.emit('PresenceChanged', { userId, ...info });
    }
  }

  static setUserOffline(userId: string) {
    const prev = this.userPresences.get(userId);
    const info: PresenceInfo = { status: 'OFFLINE', lastSeen: new Date() };
    this.userPresences.set(userId, info);

    if (prev && prev.status !== 'OFFLINE') {
      eventBus.emit('PresenceChanged', { userId, ...info });
    }
  }

  static setUserAway(userId: string) {
    const prev = this.userPresences.get(userId);
    const info: PresenceInfo = { status: 'AWAY', lastSeen: new Date() };
    this.userPresences.set(userId, info);

    if (prev && prev.status !== 'AWAY') {
      eventBus.emit('PresenceChanged', { userId, ...info });
    }
  }

  static getUserPresence(userId: string): PresenceInfo {
    return this.userPresences.get(userId) || { status: 'OFFLINE', lastSeen: new Date() };
  }
}
