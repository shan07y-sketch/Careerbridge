import { ConnectionStatus } from '@prisma/client';
import { NetworkRepository } from './network.repository';
import { ProfileRepository } from '../profile/profile.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { AppError } from '../../utils/app-error';

function displayName(profile: { firstName: string; lastName: string } | null | undefined) {
  if (!profile) return 'A CareerBridge member';
  return `${profile.firstName} ${profile.lastName}`.trim() || 'A CareerBridge member';
}

export class NetworkService {
  /**
   * Send a connection request. This is the piece that was previously
   * entirely client-side (Network.tsx toggled local state with no backend
   * call at all) -- a request now survives a refresh, is visible to the
   * other party, and produces a real notification, which is the minimum bar
   * for "would a real user understand this workflow" and "would we trust it
   * for paying customers."
   */
  static async requestConnection(userId: string, targetStudentProfileId: string) {
    const myProfile = await ProfileRepository.getStudentProfile(userId);
    if (!myProfile) {
      throw new AppError('Student profile not found for the current account.', 404, 'PROFILE_NOT_FOUND');
    }

    if (myProfile.id === targetStudentProfileId) {
      throw new AppError('You cannot send a connection request to yourself.', 400, 'INVALID_TARGET');
    }

    const targetProfile = await NetworkRepository.findProfileById(targetStudentProfileId);
    if (!targetProfile) {
      throw new AppError('The requested member could not be found.', 404, 'TARGET_NOT_FOUND');
    }

    const existing = await NetworkRepository.findExistingConnection(myProfile.id, targetStudentProfileId);
    if (existing) {
      if (existing.status === ConnectionStatus.ACCEPTED) {
        throw new AppError('You are already connected with this member.', 409, 'ALREADY_CONNECTED');
      }
      if (existing.status === ConnectionStatus.PENDING) {
        throw new AppError('A connection request is already pending with this member.', 409, 'REQUEST_PENDING');
      }
      // DECLINED or BLOCKED: don't silently resurrect it via a duplicate row.
      throw new AppError('This connection cannot be requested at this time.', 409, 'CONNECTION_UNAVAILABLE');
    }

    const connection = await NetworkRepository.createConnectionRequest(myProfile.id, targetStudentProfileId);

    await NotificationsService.createNotification({
      recipientId: targetProfile.userId,
      type: 'NETWORK',
      title: 'New connection request',
      content: `${displayName(myProfile)} wants to connect with you.`,
      priority: 'MEDIUM'
    });

    return connection;
  }

  /**
   * Accept or decline an incoming request. Only the receiver may respond --
   * this is the check that makes the workflow trustworthy rather than just
   * technically functional.
   */
  static async respondToConnection(userId: string, connectionId: string, action: 'accept' | 'decline') {
    const myProfile = await ProfileRepository.getStudentProfile(userId);
    if (!myProfile) {
      throw new AppError('Student profile not found for the current account.', 404, 'PROFILE_NOT_FOUND');
    }

    const connection = await NetworkRepository.findConnectionById(connectionId);
    if (!connection) {
      throw new AppError('Connection request not found.', 404, 'CONNECTION_NOT_FOUND');
    }

    if (connection.receiverId !== myProfile.id) {
      throw new AppError('You do not have permission to respond to this connection request.', 403, 'FORBIDDEN');
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new AppError('This connection request has already been responded to.', 409, 'ALREADY_RESOLVED');
    }

    const newStatus = action === 'accept' ? ConnectionStatus.ACCEPTED : ConnectionStatus.DECLINED;
    const updated = await NetworkRepository.updateConnectionStatus(connectionId, newStatus);

    if (action === 'accept') {
      const senderProfile = await NetworkRepository.findProfileById(connection.senderId);
      if (senderProfile) {
        await NotificationsService.createNotification({
          recipientId: senderProfile.userId,
          type: 'NETWORK',
          title: 'Connection request accepted',
          content: `${displayName(myProfile)} accepted your connection request.`,
          priority: 'MEDIUM'
        });
      }
    }

    return updated;
  }

  static async listConnections(userId: string) {
    const myProfile = await ProfileRepository.getStudentProfile(userId);
    if (!myProfile) {
      throw new AppError('Student profile not found for the current account.', 404, 'PROFILE_NOT_FOUND');
    }

    const connections = await NetworkRepository.getConnectionsForProfile(myProfile.id);

    return connections.map((c) => {
      const isSender = c.senderId === myProfile.id;
      const counterpart = isSender ? c.receiver : c.sender;
      return {
        id: c.id,
        status: c.status,
        direction: isSender ? ('outgoing' as const) : ('incoming' as const),
        updatedAt: c.updatedAt,
        counterpart: {
          id: counterpart.id,
          name: `${counterpart.firstName} ${counterpart.lastName}`.trim(),
          avatarUrl: counterpart.avatarUrl,
          role: counterpart.preferredRole
        }
      };
    });
  }
}
